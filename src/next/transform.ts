import * as path from 'path';
import * as rimraf from 'rimraf';
import * as ts from 'typescript';
import * as util from './util';
import * as bus from './bus';
import { MutationContext } from './context';
import { mutators } from './mutators';
import { Options, defaultOptions } from './options';

const DEBUG = true;

export function transform(entryFile: string, options?: Options): void {
  options = getOptions(options);
  notify(bus.events.START, { entryFile, options });

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

  emit(entryFile, options);

  if (!options.keepTempFiles) {
    const tempPath = getTempPath(basePath, options.tempFolderName);
    notify(bus.events.TEMP_DELETE_START, { tempPath });
    rimraf.sync(getTempPath(basePath, options.tempFolderName));
    notify(bus.events.TEMP_DELETE_END, { tempPath });
  }

  notify(bus.events.END, { entryFile, options });
}

export function emit(entryFile: string, options: Options) {
  const tempEntryFile = toTempFilePath(entryFile, path.dirname(entryFile), options.tempFolderName);
  notify(bus.events.EMIT_START, { entryFile, tempEntryFile, options });

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
  if (util.isKind(node, ts.SyntaxKind.SourceFile)) {
    mc.setSourceFile(node);
  }

  mc.setTransformationContext(tc);
  mc.setScope(util.getScope(node));

  return node;
}

function onAfterVisit(node: ts.Node, mc: MutationContext, tc: ts.TransformationContext): ts.Node {
  mc.addVisited(node);
  return node;
}

function transformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
  const mutationContext = new MutationContext();

  const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
    const parent = node.parent;
    node = onBeforeVisit(node, mutationContext, context);

    if (DEBUG) {
      const scope = mutationContext.scope ? ts.SyntaxKind[mutationContext.scope.kind] : 'undefined';
      console.log(`Visited: ${mutationContext.wasVisited(node) ? 'Yes' : 'No'}`)
      console.log(`Scope: ${scope}`);
      console.log(`Kind:  ${ts.SyntaxKind[node.kind]} (${node.kind})`);
      console.log(`File:  ${mutationContext.sourceFile.fileName}`);
    }

    for (let mutator of mutators) {
      node = mutator.mutateNode(node, mutationContext);
    }

    node.parent = parent;
    util.setParent(node);

    if (DEBUG) {
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


    if (DEBUG) {
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

function notify(event: string | symbol, ...args: any[]): boolean {
  return bus.emitter.emit(event, args);
}
