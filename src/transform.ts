import * as path from 'path';
import * as format from 'pretty-time';
import * as rimraf from 'rimraf';
import * as commondir from 'commondir';
import * as ts from 'typescript';
import * as util from './util';
import * as bus from './bus';
import { ProgramError } from './errors';
import { MutationContext } from './context';
import { mutators } from './mutators';
import { Options, defaultOptions } from './options';
import { Scanner } from './scanner';

let start: [number, number], elapsed: [number, number];

export function transform(entryFiles: string[], options?: Options): void {
  return transformProgram(entryFiles, options) as void;
}

export function getOptions(options: Options = {}): Options {
  const opts = Object.assign({}, defaultOptions, options);
  opts.compilerOptions = Object.assign({}, defaultOptions.compilerOptions, options.compilerOptions || {});
  return opts;
}

function transformProgram(entryFiles: string[], options?: Options): void {
  start = elapsed = process.hrtime();

  emit(bus.events.START);

  const commonDir = commondir(entryFiles.map(f => path.dirname(path.resolve(f))));

  setCompilerOptions();

  let tempEntryFiles: string[] = entryFiles.map(f => path.resolve(f));
  let tempBasePath: string = options.compilerOptions.rootDir;
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
    program = ts.createProgram(tempEntryFiles, options.compilerOptions, host);

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

    emit(bus.events.SCAN, getElapsedTime());

    scanner = new Scanner(program);

    emit(bus.events.TRANSFORM, sourceFiles, getElapsedTime());

    const result = ts.transform(sourceFiles, [transformer], options.compilerOptions);

    writeTempFiles(result);

    // do not check post-diagnostics of temp file
    // check(result.diagnostics, options.log)

    emitDeclarations();

    if (!emitTransformed() && !options.finishOnError) {
      if (!options.keepTemp) deleteTempFiles();
      emit(bus.events.STOP);
      return;
    }

    emit(bus.events.CLEANUP, getElapsedTime());

    if (!options.keepTemp) {
      deleteTempFiles();
    }

    result.dispose();

    emit(bus.events.END, getElapsedTime(), getElapsedTime(true));
  };

  function getOutDir(): string {
    if (options.compilerOptions.outFile) {
      return path.dirname(options.compilerOptions.outFile);
    }

    if (options.compilerOptions.outDir) {
      return options.compilerOptions.outDir;
    }

    return commonDir;
  }

  function deleteTempFiles(): void {
    const tempPath = path.join(commonDir, options.tempFolderName);
    rimraf.sync(tempPath);
  }

  function createProgramFromTempFiles(): void {
    tempEntryFiles = tempEntryFiles.map(f => toTempPath(f));
    tempBasePath = path.join(tempBasePath, options.tempFolderName);
    options.compilerOptions.rootDir = tempBasePath;
    host = ts.createCompilerHost(options.compilerOptions);
    program = ts.createProgram(tempEntryFiles, options.compilerOptions, host, undefined);
  }

  function writeTempFiles(result: ts.TransformationResult<ts.SourceFile>): void {
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
      const filePath = toTempPath(transformed.fileName);
      const source = printer.printFile(transformed);
      ts.sys.writeFile(filePath, source);
    }
  }

  function emitTransformed(): boolean {
    createProgramFromTempFiles();

    if (!options.compilerOptions.outFile && !options.compilerOptions.outDir) {
      options.compilerOptions.outDir = commonDir;
    }

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
    const filename = `${options.declarationFile}.js`;
    const outDir = getOutDir();

    const printer = ts.createPrinter();

    let sf = ts.createSourceFile(filename, '', options.compilerOptions.target, true, ts.ScriptKind.TS);

    const declarations = scanner.getDeclarations();
    const expressions: ts.Expression[] = [];

    for (let decl of declarations) {
      expressions.push(
        ...context.factory.namedDeclarationsReflections(
          decl.names,
          decl.symbol.getDeclarations()
        )
      );
    }

    sf = ts.updateSourceFileNode(sf, [
      context.factory.importLibStatement(),
      ...expressions.map(exp => {
        return ts.createStatement(context.factory.libCall('declare', exp));
      })
    ]);

    const printed = printer.printFile(sf);
    const transpiled = ts.transpile(printed, options.compilerOptions);

    ts.sys.writeFile(path.join(outDir, filename), transpiled);
  }

  function createMutationContext(node: ts.Node, transformationContext: ts.TransformationContext): void {
    if (ts.isSourceFile(node) && currentSourceFile !== node) {
      currentSourceFile = node;
      context = new MutationContext(node, options, program, host, scanner, transformationContext);
    }
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

      if (node && !node.parent) {
        node.parent = original.parent;
        util.setParent(node);
      }

      for (let mutator of mutators) {
        let previous = node;

        node = mutator.mutateNode(node, context);

        if (node !== previous) {
          scanner.mapNode(node, previous);
        }

        if (node && !node.parent) {
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

  function setCompilerOptions() {
    if (options.compilerOptions.outFile) {
      options.compilerOptions.outFile = path.resolve(options.compilerOptions.outFile);
    } else if (options.compilerOptions.outDir) {
      options.compilerOptions.outDir = path.resolve(options.compilerOptions.outDir);
    }

    if (options.compilerOptions.rootDir) {
      options.compilerOptions.rootDir = path.resolve(options.compilerOptions.rootDir);
    } else {
      options.compilerOptions.rootDir = commonDir;
    }

    options.compilerOptions.preserveConstEnums = true;
  }

  function toTempPath(fileName: string): string {
    const tempPath = path.dirname(fileName).replace(tempBasePath, '');
    const location = path.join(path.join(tempBasePath, options.tempFolderName, tempPath), path.basename(fileName));
    return location;
  }
}

function check(diagnostics: ts.Diagnostic[], log: boolean): boolean {
  if (diagnostics && diagnostics.length > 0) {

    emit(bus.events.DIAGNOSTICS, diagnostics, diagnostics.length);

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

function emit(event: string | symbol, ...args: any[]): boolean {
  return bus.emit(event, args);
}

function getRootNames(rootNames: string | string[]): string[] {
  if (Array.isArray(rootNames)) {
    return rootNames;
  }

  return [rootNames];
}

function getElapsedTime(fromBeginning = false): string {
  const time = process.hrtime(fromBeginning ? start : elapsed);
  if (!fromBeginning) elapsed = process.hrtime();
  return format(time, fromBeginning ? 'ms' : void 0);
}
