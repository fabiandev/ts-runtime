import * as path from 'path';
import * as ts from 'typescript';

function transformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
  const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
    return visitEachChildFirst(node, visitor, context);
  };

  const transformer: ts.Transformer<ts.SourceFile> = (sf: ts.SourceFile) => ts.visitNode(sf, visitor);

  return transformer;
}

function transform(node: ts.Node, context: ts.TransformationContext): ts.Node {
  console.log('<--------------------');
  console.log(node.getText());
  console.log('-------------------->');
  console.log('');

  if (node === null) return null;

  if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
    return null;
  }

  return node;
}

function visitEachChild(node: ts.Node, visitor: ts.Visitor, context: ts.TransformationContext): ts.Node {
  node = transform(node, context);
  if (node === null) return null;
  return ts.visitEachChild(node, visitor, context);
}

function visitEachChildFirst(node: ts.Node, visitor: ts.Visitor, context: ts.TransformationContext): ts.Node {
  node = ts.visitEachChild(node, visitor, context);
  return transform(node, context);
}

function check(diagnostics: ts.Diagnostic[]): boolean {
  if (diagnostics && diagnostics.length > 0) {
    console.error(ts.formatDiagnostics(diagnostics, {
      getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
      getNewLine: () => ts.sys.newLine,
      getCanonicalFileName: (f: string) => f
    }));
    return false;
  }

  return true;
}

function main() {
  const options: ts.CompilerOptions = {
    skipLibCheck: true,
    experimentalDecorators: true,
    noEmitOnError: false,
  };

  const beforeTransforms = [transformer];
  const afterTransforms: ts.TransformerFactory<ts.SourceFile>[] = [];

  const compilerHost = ts.createCompilerHost(options);
  const program = ts.createProgram([path.join(__dirname, './source.ts')], options, compilerHost);

  const diags: ts.Diagnostic[] = [];

  diags.push(...program.getOptionsDiagnostics());
  diags.push(...program.getGlobalDiagnostics());

  for (let sourceFile of program.getSourceFiles().filter(sf => !/\.d\.ts$/.test(sf.fileName))) {
    diags.push(...program.getSyntacticDiagnostics(sourceFile));
    diags.push(...program.getSemanticDiagnostics(sourceFile));
  }

  console.log('check before emit');
  check(diags);

  const { diagnostics } = program.emit(
    undefined, undefined, undefined, undefined, { before: beforeTransforms, after: afterTransforms }
  );

  console.log('check after emit');
  check(diagnostics);
}

main();
