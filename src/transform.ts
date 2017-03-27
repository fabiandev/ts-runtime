import * as path from 'path';
import * as rimraf from 'rimraf';
import * as ts from 'typescript';
import * as util from './util';
import * as bus from './bus';
import { MutationContext } from './context';
import { mutators } from './mutators';
import { Options, defaultOptions } from './options';

const DEBUG = false;

export function transform(entryFile: string, options?: Options) {
  options = getOptions(options);

  let host: ts.CompilerHost;
  let program: ts.Program;

  (function autoStartTransformation(): void {
    notify(bus.events.START, { entryFile, options });

    const basePath = path.dirname(entryFile);

    host = ts.createCompilerHost(options.compilerOptions, true);
    program = ts.createProgram([entryFile], options.compilerOptions, host);

    const diagnostics: ts.Diagnostic[] = [];

    diagnostics.push(...program.getOptionsDiagnostics());
    diagnostics.push(...program.getGlobalDiagnostics());

    for (let sourceFile of program.getSourceFiles().filter(sf => !/\.d\.ts$/.test(sf.fileName))) {
      diagnostics.push(...program.getSyntacticDiagnostics(sourceFile));
      diagnostics.push(...program.getSemanticDiagnostics(sourceFile));
    }

    if (!check(diagnostics)) {
      notify(bus.events.DIAGNOSTICS_TRANSFORM, { diagnostics });
      notify(bus.events.DIAGNOSTICS_TRANSFORM_PRE, { diagnostics });
    }

    const sourceFiles = program.getSourceFiles().filter(sf => !sf.isDeclarationFile);

    notify(bus.events.TRANSFORM_START, { sourceFiles });
    const result = ts.transform(sourceFiles, [transformer], options.compilerOptions);
    notify(bus.events.TRANSFORM_END, { sourceFiles: result.transformed });

    if (!check(result.diagnostics)) {
      notify(bus.events.DIAGNOSTICS_TRANSFORM, { diagnostics });
      notify(bus.events.DIAGNOSTICS_TRANSFORM_POST, { diagnostics: result.diagnostics });
    }

    const printerOptions: ts.PrinterOptions = {
      target: options.compilerOptions.target,
      removeComments: false
    };

    const printHandlers: ts.PrintHandlers = {
      substituteNode(hint: ts.EmitHint, node: ts.Node): ts.Node {
        return node;
      }
    };

    notify(bus.events.WRITE_START, { count: result.transformed.length });
    const printer = ts.createPrinter(printerOptions, printHandlers);

    let count = 0;
    for (let transformed of result.transformed) {
      count++;
      const location = toTempFilePath(transformed.fileName, basePath, options.tempFolderName);
      const source = printer.printFile(transformed);
      notify(bus.events.WRITE_FILE_START, { location, transformed, source });
      ts.sys.writeFile(location, source);
      notify(bus.events.WRITE_FILE_END, { location, transformed, source });
    }

    notify(bus.events.WRITE_END, { count });

    result.dispose();

    emitTransformed();

    if (!options.keepTempFiles) {
      const tempPath = getTempPath(basePath, options.tempFolderName);
      notify(bus.events.TEMP_DELETE_START, { tempPath });
      rimraf.sync(getTempPath(basePath, options.tempFolderName));
      notify(bus.events.TEMP_DELETE_END, { tempPath });
    }

    notify(bus.events.END, { entryFile, options });
  })();

  function emitTransformed() {
    const tempEntryFile = toTempFilePath(entryFile, path.dirname(entryFile), options.tempFolderName);
    notify(bus.events.EMIT_START, { entryFile, tempEntryFile, options });

    options.compilerOptions.outDir = path.dirname(entryFile);

    host = ts.createCompilerHost(options.compilerOptions);
    program = ts.createProgram([tempEntryFile], options.compilerOptions, host);

    const diagnostics: ts.Diagnostic[] = [];

    diagnostics.push(...program.getOptionsDiagnostics());
    diagnostics.push(...program.getGlobalDiagnostics());

    for (let sourceFile of program.getSourceFiles().filter(sf => !/\.d\.ts$/.test(sf.fileName))) {
      diagnostics.push(...program.getSyntacticDiagnostics(sourceFile));
      diagnostics.push(...program.getSemanticDiagnostics(sourceFile));
    }


    if (!check(diagnostics)) {
      notify(bus.events.DIAGNOSTICS_EMIT, { diagnostics });
      notify(bus.events.DIAGNOSTICS_EMIT_PRE, { diagnostics });
    }

    const emitResult = program.emit();

    if (!check(emitResult.diagnostics)) {
      notify(bus.events.DIAGNOSTICS_EMIT, { diagnostics: emitResult.diagnostics });
      notify(bus.events.DIAGNOSTICS_EMIT_POST, { diagnostics: emitResult.diagnostics });
    }

    notify(bus.events.EMIT_END, { entryFile, tempEntryFile, options });
  }

  function onBeforeVisit(node: ts.Node, mc: MutationContext, tc: ts.TransformationContext): ts.Node {
    return node;
  }

  function onAfterVisit(node: ts.Node, mc: MutationContext, tc: ts.TransformationContext): ts.Node {
    mc.addVisited(node);
    return node;
  }

  function transformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    let mutationContext: MutationContext;

    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
      if (node.kind === ts.SyntaxKind.SourceFile) {
        mutationContext = new MutationContext(options, node as ts.SourceFile, program, host, context);
      }

      const parent = node.parent;
      node = onBeforeVisit(node, mutationContext, context);

      debugText('~~~~~~~~~~~~~~~~~~~~~');
      debugText('Before Mutation:');
      debugText('~~~~~~~~~~~~~~~~~~~~~');
      debugNodeAttributes(node, mutationContext);
      debugNodeText(node, mutationContext);

      for (let mutator of mutators) {
        node = mutator.mutateNode(node, mutationContext);
      }

      node.parent = parent;
      util.setParent(node);

      node = onAfterVisit(node, mutationContext, context);

      debugSpaces();
      debugText('~~~~~~~~~~~~~~~~~~~~~');
      debugText('After Mutation:');
      debugText('~~~~~~~~~~~~~~~~~~~~~');
      debugNodeAttributes(node, mutationContext);
      debugNodeText(node, mutationContext);
      debugSpaces(3);

      return ts.visitEachChild(node, visitor, context);
    };

    return (sf: ts.SourceFile) => ts.visitNode(sf, visitor);
  }

}

export function getOptions(options: Options = {}): Options {
  const opts = Object.assign({}, defaultOptions, options);
  opts.compilerOptions = Object.assign({}, defaultOptions.compilerOptions, options.compilerOptions || {});
  return opts;
}

export function getRootNames(rootNames: string | string[]): string[] {
  if (Array.isArray(rootNames)) {
    return rootNames;
  }

  return [rootNames];
}

export function getTempPath(basePath: string, tempFolderName: string): string {
  return path.join(basePath, tempFolderName);
}

export function toTempFilePath(file: string, basePath: string, tempFolderName: string): string {
  const pathFromBase = path.dirname(file.replace(basePath, ''));
  const tempPath = getTempPath(basePath, tempFolderName);
  const fileName = path.basename(file);

  return path.join(tempPath, pathFromBase, fileName);
}

export function check(diagnostics: ts.Diagnostic[]): boolean {
  if (diagnostics && diagnostics.length > 0) {
    notify(bus.events.DIAGNOSTICS, { diagnostics });
    console.error(ts.formatDiagnostics(diagnostics, {
      getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
      getNewLine: () => ts.sys.newLine,
      getCanonicalFileName: (f: string) => f
    }));
    return false;
  }

  return true;
}

export function notify(event: string | symbol, ...args: any[]): boolean {
  return bus.emitter.emit(event, args);
}

function debugNodeAttributes(node: ts.Node, mutationContext: MutationContext): void {
  if (!DEBUG) return;
  const scope = util.getScope(node);
  const scopeKind = scope ? ts.SyntaxKind[scope.kind] : 'undefined';
  console.log(`Kind: ${ts.SyntaxKind[node.kind]} (${node.kind})`);
  try {
    console.log(`Implicit Type: ${mutationContext.getImplicitTypeText(node)}`);
  } catch (e) {
    console.log('Implicit Type:');
  }
  console.log(`Visited: ${mutationContext.wasVisited(node) ? 'Yes' : 'No'}`);
  console.log(`Scope: ${scopeKind}`);
  console.log(`Synthesized: ${node.flags === ts.NodeFlags.Synthesized ? 'Yes' : 'No'}`);
  console.log(`File: ${mutationContext.sourceFile.fileName}`);
}

function debugNodeText(node: ts.Node, mutstionContext: MutationContext) {
  if (!DEBUG) return;
  console.log('<============================================');
  if (node.parent) {
    if (node.flags === ts.NodeFlags.Synthesized) {
      console.log('Cannot get text of synthesized node.');
    } else {
      console.log(node.getText());
    }
  } else {
    console.log('Parent not set, cannot get text.');
  }
  console.log('============================================>');
}

function debugText(text: string) {
  if (!DEBUG) return;
  console.log(text);
}

function debugSpaces(spaces: number = 1) {
  if (!DEBUG) return;
  console.log(Array(Math.abs(spaces) + 1).join('\n'));
}
