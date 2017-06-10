import * as path from 'path';
import * as rimraf from 'rimraf';
import * as ts from 'typescript';
import * as util from './util';
import * as bus from './bus';
import { ProgramError } from './errors';
import { MutationContext } from './context';
import { mutators } from './mutators';
import { Options, defaultOptions } from './options';
import { Scanner } from './scanner';

export function transform(entryFile: string, options?: Options): void {
  return transformProgram(entryFile, options) as void;
}

function transformProgram(entryFile: string, options?: Options): void {
  emit(bus.events.START);

  entryFile = path.normalize(entryFile);
  options = getOptions(options);

  options.compilerOptions.rootDir = options.compilerOptions.rootDir || path.dirname(entryFile);
  options.compilerOptions.preserveConstEnums = true;

  const basePath = options.compilerOptions.rootDir;

  let tempEntryFile: string = entryFile;
  let tempBasePath: string = basePath;
  let host: ts.CompilerHost;
  let program: ts.Program;
  let scanner: Scanner;
  let context: MutationContext;
  let currentSourceFile: ts.SourceFile;

  return startTransformation();

  function startTransformation(): void {
    let sourceFiles: ts.SourceFile[];

    deleteTempFiles();

    host = ts.createCompilerHost(options.compilerOptions, true);
    program = ts.createProgram([entryFile], options.compilerOptions, host);

    const diagnostics: ts.Diagnostic[] = [];

    diagnostics.push(...program.getOptionsDiagnostics());
    diagnostics.push(...program.getGlobalDiagnostics());

    for (let sourceFile of program.getSourceFiles().filter(sf => !/\.d\.ts$/.test(sf.fileName))) {
      diagnostics.push(...program.getSyntacticDiagnostics(sourceFile));
      diagnostics.push(...program.getSemanticDiagnostics(sourceFile));
    }

    // Check original file (pre-diagnostics)
    if (!check(diagnostics, options.log) && !options.finishOnError) {
      if (!options.keepTemp) deleteTempFiles();
      emit(bus.events.STOP);
      return;
    }

    sourceFiles = program.getSourceFiles().filter(sf => !sf.isDeclarationFile);
    // scanner = new Scanner(program);

    emit(bus.events.TRANSFORM, sourceFiles);

    // const typedResult = ts.transform(sourceFiles, [firstPassTransformer], options.compilerOptions);
    //
    // writeTempFiles(typedResult);
    // createProgramFromTempFiles();

    // sourceFiles = program.getSourceFiles().filter(sf => !sf.isDeclarationFile);
    scanner = new Scanner(program);

    const result = ts.transform(sourceFiles, [transformer], options.compilerOptions);

    writeTempFiles(result, true);

    // do not check post-diagnostics of temp file
    // check(result.diagnostics, options.log)

    emitDeclarations();

    if (!emitTransformed() && !options.finishOnError) {
      if (!options.keepTemp) deleteTempFiles();
      emit(bus.events.STOP);
      return;
    }

    emit(bus.events.CLEANUP);

    if (!options.keepTemp) {
      deleteTempFiles();
    }

    // typedResult.dispose();
    result.dispose();

    emit(bus.events.END);
  };

  function getOutDir(): string {
    return options.compilerOptions.outDir || path.resolve(path.dirname(entryFile));
  }

  function deleteTempFiles(): void {
    const tempPath = getTempPath(basePath, options.tempFolderName);
    rimraf.sync(getTempPath(basePath, options.tempFolderName));
  }

  function createProgramFromTempFiles(): void {
    tempEntryFile = toTempFilePath(tempEntryFile, basePath, options.tempFolderName);
    tempBasePath = getTempPath(tempBasePath, options.tempFolderName);
    options.compilerOptions.rootDir = tempBasePath;
    host = ts.createCompilerHost(options.compilerOptions);
    program = ts.createProgram([tempEntryFile], options.compilerOptions, host, undefined);
  }

  function writeTempFiles(result: ts.TransformationResult<ts.SourceFile>, removeTypes = false): void {
    const printerOptions: ts.PrinterOptions = {
      removeComments: false
    };

    const printHandlers: ts.PrintHandlers = {
      substituteNode(hint: ts.EmitHint, node: ts.Node): ts.Node {
        return node;
      }
    };

    const printer = ts.createPrinter(printerOptions, printHandlers);

    for (let transformed of result.transformed) {
      const location = toTempFilePath(transformed.fileName, basePath, options.tempFolderName);
      const source = printer.printFile(transformed);
      ts.sys.writeFile(location, source);
    }
  }

  function emitTransformed(): boolean {
    options.compilerOptions.outDir = getOutDir();

    createProgramFromTempFiles();

    const diagnostics: ts.Diagnostic[] = [];

    diagnostics.push(...program.getOptionsDiagnostics());
    diagnostics.push(...program.getGlobalDiagnostics());

    for (let sourceFile of program.getSourceFiles().filter(sf => !/\.d\.ts$/.test(sf.fileName))) {
      diagnostics.push(...program.getSyntacticDiagnostics(sourceFile));
      diagnostics.push(...program.getSemanticDiagnostics(sourceFile));
    }

    // do not check pre-diagnostics of temp file
    // check(diagnostics, options.log);

    const emitResult = program.emit();

    // check final result (post-diagnostics)

    return check(emitResult.diagnostics, options.log);
  }

  function emitDeclarations() {
    const filename = `${options.declarationFile}.ts`;
    const outDir = path.dirname(toTempFilePath(tempEntryFile, basePath, options.tempFolderName));
    const printer = ts.createPrinter();

    let sf = ts.createSourceFile(filename, '', options.compilerOptions.target, true, ts.ScriptKind.TS);

    const declarations = scanner.getDeclarations();
    const expressions: ts.Expression[] = [];

    declarations.forEach((names, key) => {
      expressions.unshift(...context.factory.namedDeclarationsReflections(names, key.getDeclarations()));
    });

    sf = ts.updateSourceFileNode(sf, [
      context.factory.importLibStatement(),
      ...expressions.map(exp => {
        return ts.createStatement(context.factory.libCall('declare', exp));
      })
    ])

    ts.sys.writeFile(path.join(outDir, filename), printer.printFile(sf));
  }

  function createMutationContext(node: ts.Node, transformationContext: ts.TransformationContext): void {
    if (ts.isSourceFile(node) && currentSourceFile !== node) {
      currentSourceFile = node;
      context = new MutationContext(node, options, program, host, scanner, transformationContext, path.resolve(tempEntryFile));
    }
  }

  function firstPassTransformer(transformationContext: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
      // if (node && !(node as any).type) util.annotateWithAny(node);
      return ts.visitEachChild(node, visitor, transformationContext);
    };

    return (sf: ts.SourceFile) => {
      return ts.visitNode(sf, visitor);
    };
  }

  function transformer(transformationContext: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
      const original = node;

      if (node && !(node as any).type) {
        if (util.annotateWithAny(node)) {
        }
      }

      node = ts.visitEachChild(node, visitor, transformationContext);

      if (node !== original) {
        scanner.mapNode(node, original);
      }

      if (!node.parent) {
        node.parent = original.parent;
        util.setParent(node);
      }

      for (let mutator of mutators) {
        let previous = node;

        node = mutator.mutateNode(node, context);

        if (node !== previous) {
          scanner.mapNode(node, previous);
        }

        if (!node.parent) {
          node.parent = previous.parent;
          util.setParent(node);
        }
      }

      if (!node) {
        return node;
      }

      return node;
    };

    return (sf: ts.SourceFile) => {
      createMutationContext(sf, transformationContext);
      return ts.visitNode(sf, visitor);
    }
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
  return path.join(path.resolve(basePath), tempFolderName);
}

export function toTempFilePath(file: string, basePath: string, tempFolderName: string): string {
  const pathFromBase = path.dirname(path.resolve(file).replace(path.resolve(basePath), ''));
  const tempPath = getTempPath(basePath, tempFolderName);
  const fileName = path.basename(file);

  return path.join(tempPath, pathFromBase, fileName);
}

export function check(diagnostics: ts.Diagnostic[], log: boolean): boolean {
  if (diagnostics && diagnostics.length > 0) {

    emit(bus.events.DIAGNOSTICS, diagnostics.slice(0, 25), diagnostics.length);

    if (log) {
      console.error(ts.formatDiagnostics(diagnostics, {
        getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
        getNewLine: () => ts.sys.newLine,
        getCanonicalFileName: (f: string) => f
      }));
    }

    return false;
  }

  return true;
}

export function emit(event: string | symbol, ...args: any[]): boolean {
  return bus.emitter.emit(event, args);
}
