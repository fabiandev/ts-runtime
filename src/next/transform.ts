import * as path from 'path';
import * as rimraf from 'rimraf';
import * as ts from 'typescript';
import * as bus from './bus';
import { MutationContext } from './context';
import { mutators } from './mutators';
import { Options, defaultOptions } from './options';

const DEBUG = true;

export function transform(entryFile: string, options?: Options): void {
  options = getOptions(options);
  bus.emitter.emit(bus.events.START, { entryFile, options });

  const basePath = path.dirname(entryFile);
  const host = ts.createCompilerHost(options.compilerOptions);
  const program = ts.createProgram([entryFile], options.compilerOptions, host);

  const diagnostics: ts.Diagnostic[] = [];

  diagnostics.push(...program.getOptionsDiagnostics());
  diagnostics.push(...program.getGlobalDiagnostics());

  for (let sourceFile of program.getSourceFiles().filter(sf => !/\.d\.ts$/.test(sf.fileName))) {
    diagnostics.push(...program.getSyntacticDiagnostics(sourceFile));
    diagnostics.push(...program.getSemanticDiagnostics(sourceFile));
  }

  if (!check(diagnostics)) {
    bus.emitter.emit(bus.events.DIAGNOSTICS_TRANSFORM, { diagnostics });
    bus.emitter.emit(bus.events.DIAGNOSTICS_TRANSFORM_PRE, { diagnostics });
  }

  const sourceFiles = program.getSourceFiles().filter(sf => !sf.isDeclarationFile);

  bus.emitter.emit(bus.events.TRANSFORM_START, { sourceFiles });
  const result = ts.transform(sourceFiles, [transformer], options.compilerOptions);
  bus.emitter.emit(bus.events.TRANSFORM_END, { sourceFiles: result.transformed });

  if (!check(result.diagnostics)) {
    bus.emitter.emit(bus.events.DIAGNOSTICS_TRANSFORM, { diagnostics });
    bus.emitter.emit(bus.events.DIAGNOSTICS_TRANSFORM_POST, { diagnostics: result.diagnostics });
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

  bus.emitter.emit(bus.events.WRITE_START, { count: result.transformed.length });
  const printer = ts.createPrinter(printerOptions, printHandlers);

  let count = 0;
  for (let transformed of result.transformed) {
    count++;
    const location = toTempFilePath(transformed.fileName, basePath, options.tempFolderName);
    const source = printer.printFile(transformed);
    bus.emitter.emit(bus.events.WRITE_FILE_START, { location, transformed, source });
    ts.sys.writeFile(location, source);
    bus.emitter.emit(bus.events.WRITE_FILE_END, { location, transformed, source });
  }

  bus.emitter.emit(bus.events.WRITE_END, { count });
  result.dispose();

  emit(entryFile, options);

  if (!options.keepTempFiles) {
    const tempPath = getTempPath(basePath, options.tempFolderName);
    bus.emitter.emit(bus.events.TEMP_DELETE_START, { tempPath });
    rimraf.sync(getTempPath(basePath, options.tempFolderName));
    bus.emitter.emit(bus.events.TEMP_DELETE_END, { tempPath });
  }

  bus.emitter.emit(bus.events.END, { entryFile, options });
}

export function emit(entryFile: string, options: Options) {
  const tempEntryFile = toTempFilePath(entryFile, path.dirname(entryFile), options.tempFolderName);
  bus.emitter.emit(bus.events.EMIT_START, { entryFile, tempEntryFile, options });

  options.compilerOptions.outDir = path.dirname(entryFile);

  const host = ts.createCompilerHost(options.compilerOptions);
  const program = ts.createProgram([tempEntryFile], options.compilerOptions, host);

  const diagnostics: ts.Diagnostic[] = [];

  diagnostics.push(...program.getOptionsDiagnostics());
  diagnostics.push(...program.getGlobalDiagnostics());

  for (let sourceFile of program.getSourceFiles().filter(sf => !/\.d\.ts$/.test(sf.fileName))) {
    diagnostics.push(...program.getSyntacticDiagnostics(sourceFile));
    diagnostics.push(...program.getSemanticDiagnostics(sourceFile));
  }


  if (!check(diagnostics)) {
    bus.emitter.emit(bus.events.DIAGNOSTICS_EMIT, { diagnostics });
    bus.emitter.emit(bus.events.DIAGNOSTICS_EMIT_PRE, { diagnostics });
  }

  const emitResult = program.emit();

  if (!check(emitResult.diagnostics)) {
    bus.emitter.emit(bus.events.DIAGNOSTICS_EMIT, { diagnostics: emitResult.diagnostics });
    bus.emitter.emit(bus.events.DIAGNOSTICS_EMIT_POST, { diagnostics: emitResult.diagnostics });
  }

  bus.emitter.emit(bus.events.EMIT_END, { entryFile, tempEntryFile, options });
}

function onBeforeVisit(node: ts.Node, mc: MutationContext, tc: ts.TransformationContext): ts.Node {
  mc.setTransformationContext(tc);
  mc.setSourceFile(node);
  mc.setScope(node);

  return node;
}

function onAfterVisit(node: ts.Node, mc: MutationContext, tc: ts.TransformationContext): ts.Node {
  mc.addVisited(node);

  return node;
}

function transformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
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
      console.log(`Kind:  ${ts.SyntaxKind[node.kind]} (${node.kind})`);
      console.log(`File:  ${mutationContext.sourceFile.fileName}`);
      console.log('<============================================');
      console.log(node.getText());
      console.log('============================================>');
      console.log('\n\n');
    }

    node = onAfterVisit(node, mutationContext, context);

    return ts.visitEachChild(node, visitor, context);
  };

  return (sf: ts.SourceFile) => ts.visitNode(sf, visitor);
}

function getOptions(options: Options = {}): Options {
  const opts = Object.assign({}, defaultOptions, options);
  opts.compilerOptions = Object.assign({}, defaultOptions.compilerOptions, options.compilerOptions || {});
  return opts;
}

function getRootNames(rootNames: string | string[]): string[] {
  if (Array.isArray(rootNames)) {
    return rootNames;
  }

  return [rootNames];
}

function getTempPath(basePath: string, tempFolderName: string): string {
  return path.join(basePath, tempFolderName);
}

function toTempFilePath(file: string, basePath: string, tempFolderName: string): string {
  const pathFromBase = path.dirname(file.replace(basePath, ''));
  const tempPath = getTempPath(basePath, tempFolderName);
  const fileName = path.basename(file);

  return path.join(tempPath, pathFromBase, fileName);
}

function check(diagnostics: ts.Diagnostic[]): boolean {
  if (diagnostics && diagnostics.length > 0) {
    bus.emitter.emit(bus.events.DIAGNOSTICS, { diagnostics });
    console.error(ts.formatDiagnostics(diagnostics, {
      getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
      getNewLine: () => ts.sys.newLine,
      getCanonicalFileName: (f: string) => f
    }));
    return false;
  }

  return true;
}
