import * as ts from 'typescript';
import { bus, messages } from './bus';
import { Options, defaultOptions } from './options';
import { Mutator } from './mutators/Mutator';
import { MutationContext } from './context';
import { mutators } from './mutators';

const DEBUG = true;

export function transform(files: string | string[], options?: Options): ts.EmitResult {
  const compilerOptions = Object.assign({}, defaultOptions.compilerOptions, options.compilerOptions);
  const opts = Object.assign({}, defaultOptions, options);
  opts.compilerOptions = compilerOptions;

  const rootNames = Array.isArray(files) ? files : [files];

  const compilerHost = ts.createCompilerHost(compilerOptions);
  const program = ts.createProgram(rootNames, compilerOptions, compilerHost);

  const diags: ts.Diagnostic[] = [];

  diags.push(...program.getOptionsDiagnostics());
  diags.push(...program.getGlobalDiagnostics());

  for (let sourceFile of program.getSourceFiles().filter(sf => !/\.d\.ts$/.test(sf.fileName))) {
    diags.push(...program.getSyntacticDiagnostics(sourceFile));
    diags.push(...program.getSemanticDiagnostics(sourceFile));
  }

  check(diags);

  const beforeTransforms: ts.TransformerFactory<ts.SourceFile>[] = [beforeTransformer];
  const afterTransforms: ts.TransformerFactory<ts.SourceFile>[] = [afterTransformer];

  const emitResult = program.emit(
    undefined, undefined, undefined, undefined,
    { before: beforeTransforms, after: afterTransforms }
  );

  check(emitResult.diagnostics);

  return emitResult;
}

function onBeforeVisit(node: ts.Node, mc: MutationContext, tc: ts.TransformationContext): ts.Node {
  mc.setTransformationContext(tc);
  mc.setScope(node);

  return node;
}

function onAfterVisit(node: ts.Node, mc: MutationContext, tc: ts.TransformationContext): ts.Node {
  mc.addVisited(node);

  return node;
}

function beforeTransformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
  const mutationContext = new MutationContext();

  const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
    node = onBeforeVisit(node, mutationContext, context);

    if (DEBUG && !mutationContext.wasVisited(node)) {
      const scope = mutationContext.scope ? ts.SyntaxKind[mutationContext.scope.kind] : 'undefined';
      console.log(`Scope: ${scope}`);
    }

    for (let mutator of mutators) {
      node = mutator.mutateNode(node, mutationContext);
      mutationContext.addVisited(node);
    }

    if (DEBUG && node.parent) {
      console.log(`Kind:  ${ts.SyntaxKind[node.kind]}`);
      console.log('<===================');
      console.log(node.getText());
      console.log('==================>');
      console.log('\n\n');
    }

    node = onAfterVisit(node, mutationContext, context);

    return ts.visitEachChild(node, visitor, context);
  };

  return (sf: ts.SourceFile) => ts.visitNode(sf, visitor);
}

function afterTransformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
  const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
    // const flags = ts.getCombinedModifierFlags(node);
    // const str = ts.ModifierFlags[flags];
    // console.log(str);
    return ts.visitEachChild(node, visitor, context);
  };

  return (sf: ts.SourceFile) => ts.visitNode(sf, visitor);
}

function check(diagnostics: ts.Diagnostic[]): void {
  if (diagnostics && diagnostics.length > 0) {
    bus.emit(messages.TS_COMPILER_DIAGNOSTICS, diagnostics);
    console.error(ts.formatDiagnostics(diagnostics, {
      getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
      getNewLine: () => ts.sys.newLine,
      getCanonicalFileName: (f: string) => f
    }));
  }
}
