import * as path from 'path';
import * as format from 'pretty-time';
import * as rimraf from 'rimraf';
import * as commondir from 'commondir';
import * as ts from 'typescript';
import * as util from './util';
import * as bus from './bus';
import { MutationContext } from './context';
import { getMutators } from './mutators';
import { Host, FileReflection } from './host';
import { Options, defaultOptions } from './options';
import { Scanner, TsrDeclaration } from './scanner';

let start: [number, number], elapsed: [number, number];

export function transform(rootNames: string[], options?: Options): FileReflection[] {
  return result(transformProgram(rootNames, options));
}

export function transformReflection(rootNames: string | string[], reflections: FileReflection[], options?: Options): FileReflection[] {
  return result(transformProgram(rootNames, options, reflections));
}

export function getOptions(options: Options = {}): Options {
  const opts = Object.assign({}, defaultOptions, options);
  const compilerOptions = Object.assign(ts.getDefaultCompilerOptions(), defaultOptions.compilerOptions, options && options.compilerOptions || {});
  opts.compilerOptions = compilerOptions;
  return opts;
}

function result(host: Host | void): FileReflection[] {
  if (!host) return [];
  return host.getResult();
}

function transformProgram(rootNames: string | string[], options?: Options, reflections?: FileReflection[]): Host | void {
  if (!reflections) start = elapsed = process.hrtime();

  const entryFiles = util
    .asArray(rootNames)
    .map(file => path.normalize(file))
    .map(file => !path.extname(file) ? file + '.ts' : file);

  options = getOptions(options);

  emit(bus.events.START);

  let resolvedEntryFiles: string[];
  let commonDir: string;
  let host: ts.CompilerHost;

  if (!reflections) {
    resolvedEntryFiles = entryFiles.map(f => path.resolve(f));
    commonDir = commondir(resolvedEntryFiles.map(f => path.dirname(f)));
    setCompilerOptions();
    host = ts.createCompilerHost(options.compilerOptions, true);
  } else {
    resolvedEntryFiles = entryFiles.map(f => path.join(`${path.resolve(path.dirname(f))}`, path.basename(f)));
    commonDir = commondir(resolvedEntryFiles.map(f => path.dirname(f)));
    reflections = reflections.map(f => {
      return {
        name: path.join(`${path.resolve(path.dirname(f.name))}`, path.basename(f.name)),
        text: f.text
      }
    });

    setCompilerOptions();
    setCompilerOptionsForReflection();

    host = new Host(reflections, options.compilerOptions, true);
  }

  let tempBasePath: string = options.compilerOptions.rootDir;
  let program: ts.Program;
  let scanner: Scanner;
  let context: MutationContext;
  let currentSourceFile: ts.SourceFile;

  return startTransformation();

  function startTransformation(): Host | void {
    program = ts.createProgram(resolvedEntryFiles, options.compilerOptions, host);
    const { diagnostics, optionsDiagnostics, syntacticDiagnostics } = getDiagnostics();

    if (options.compilerOptions.noEmitOnError === false) {
      options.force = true;
    }

    if (!check(diagnostics, options.log) && (!options.force)) {
      emit(bus.events.STOP);
      return;
    }

    if (optionsDiagnostics.length > 0) {
      emit(bus.events.STOP);
      return;
    }

    if (syntacticDiagnostics.length > 0) {
      emit(bus.events.STOP);
      return;
    }

    if (options.compilerOptions.declaration) {
      options.compilerOptions.emitDeclarationOnly = true;
      program.emit();
      options.compilerOptions.declaration = false;
      options.compilerOptions.emitDeclarationOnly = false;
    }

    const sourceFiles = program.getSourceFiles().filter(sf => !sf.isDeclarationFile);
    emit(bus.events.SCAN, getElapsedTime());
    scanner = new Scanner(program, options);
    emit(bus.events.TRANSFORM, sourceFiles, getElapsedTime());
    const result = ts.transform(sourceFiles, [transformer], options.compilerOptions);
    emit(bus.events.EMIT, getElapsedTime());

    if (!emitTransformed(result) && !options.force) {
      emit(bus.events.STOP);
      return;
    }

    emitDeclarations();
    result.dispose();
    emit(bus.events.END, getElapsedTime(), getElapsedTime(true));
    emit(bus.events.STOP, true);

    return host as Host;
  };

  function emitTransformed(result: ts.TransformationResult<ts.SourceFile>): boolean {
    if (!options.compilerOptions.outFile && !options.compilerOptions.outDir) {
      options.compilerOptions.outDir = commonDir;
    }

    host = getHostFromTransformationResult(result);
    program = ts.createProgram(resolvedEntryFiles, {...options.compilerOptions, noEmitOnError: false}, host, program);

    const { diagnostics } = program.emit();

    return check(diagnostics, options.log);
  }

  function emitDeclarations() {
    const filename = `${options.declarationFileName}.js`;
    const outDir = getOutDir();
    const location = path.join(outDir, filename);
    if (!reflections) rimraf.sync(location);

    const printerOptions: ts.PrinterOptions = {
      removeComments: false
    };

    const printHandlers: ts.PrintHandlers = {
      substituteNode(hint: ts.EmitHint, node: ts.Node): ts.Node {
        // TODO: fix any cast
        (node.parent as any) = undefined;
        (node.flags as any) |= ts.NodeFlags.Synthesized;
        return node;
      }
    };

    const printer = ts.createPrinter(printerOptions, printHandlers);
    let sourceFile = ts.createSourceFile(filename, '', options.compilerOptions.target, true, ts.ScriptKind.TS);

    const expressions: ts.Expression[] = [];
    let names: string[] = []
    let processed = 0;

    let declarations: TsrDeclaration[];
    let length: number;

    do {
      declarations = scanner.getDeclarations();
      length = declarations.length;

      if (length < 1) {
        return;
      }

      for (let i = 0; i < declarations.length - processed; i++) {
        if (names.indexOf(declarations[i].name) !== -1) {
          continue;
        }

        names.push(declarations[i].name);

        expressions.unshift(
          ...context.factory.namedDeclarationsReflections(
            declarations[i].name,
            declarations[i].symbol.getDeclarations(),
            declarations[i].originalName
          )
        );
      }

      processed = length;
    } while (length !== scanner.getDeclarations().length);

    if (expressions.length < 1) {
      return;
    }

    sourceFile = ts.updateSourceFileNode(sourceFile, [
      context.factory.importLibStatement(),
      ...expressions.map(exp => {
        return ts.createStatement(exp);
      })
    ]);

    const printed = printer.printFile(sourceFile);
    const transpiled = ts.transpile(printed, options.compilerOptions);
    const writeHost = !reflections ? ts.sys : host as Host;

    writeHost.writeFile(location, transpiled);
  }

  function createMutationContext(node: ts.Node, transformationContext: ts.TransformationContext): void {
    if (ts.isSourceFile(node) && currentSourceFile !== node) {
      currentSourceFile = node;
      context = new MutationContext(node, options, program, host, scanner, resolvedEntryFiles, commonDir, transformationContext);
    }
  }

  // TODO: add source map range in mutators
  // TODO: infer implicit types and add to global declarations immediately
  // TODO: support (recursive) opt-in only mode via verify<FooType>(value);
  function transformer(transformationContext: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
      const original = node;

      if (node && !(node as any).type) {
        if (util.annotateWithAny(node)) {
          // do nothing for now
        }
      }

      node = ts.visitEachChild(node, visitor, transformationContext);

      if (node !== original) {
        scanner.mapNode(node, original);
      }

      if (node && !node.parent) {
        // TODO: fix any cast
        (node.parent as any) = original.parent;
        util.setParent(node);
      }

      for (let mutator of getMutators()) {
        let previous = node;

        node = mutator.mutateNode(node, context);

        if (node !== previous) {
          scanner.mapNode(node, previous);
        }

        if (node && !node.parent) {
          // TODO: fix any cast
          (node.parent as any) = previous.parent;
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

    if (options.compilerOptions.noEmitOnError) {
      const warning = 'Compiler option \'noEmitOnError\' is the default behavior.';
      options.compilerOptions.noEmitOnError = false;
      emit(bus.events.WARN, warning);
      if (options.log) console.warn(warning);
    }

    if (!options.compilerOptions.preserveConstEnums) {
      const warning = 'Compiler option \'emitDeclarationOnly\' is not supported.';
      options.compilerOptions.preserveConstEnums = true;
      emit(bus.events.WARN, warning);
      if (options.log) console.warn(warning);
    }

    if (!options.compilerOptions.preserveConstEnums) {
      const warning = 'Compiler option \'preserveConstEnums\' was enabled.';
      options.compilerOptions.preserveConstEnums = true;
      emit(bus.events.WARN, warning);
      if (options.log) console.warn(warning);
    }

    if (!options.compilerOptions.experimentalDecorators) {
      const warning = 'Compiler option \'experimentalDecorators\' was enabled.';
      options.compilerOptions.experimentalDecorators = true;
      emit(bus.events.WARN, warning);
      if (options.log) console.warn(warning);
    }
  }

  function setCompilerOptionsForReflection() {

  }

  function getHostFromTransformationResult(result: ts.TransformationResult<ts.SourceFile>): Host {
    const previousHost = host;
    const printer = ts.createPrinter();
    const files: FileReflection[] = [];

    for (let transformed of result.transformed) {
      const name = transformed.fileName;
      const text = printer.printFile(transformed);
      files.push({ name, text });
    }

    const newHost = new Host(files, options.compilerOptions);

    newHost.setNewLine(previousHost.getNewLine());
    newHost.setCurrentDirectory(previousHost.getCurrentDirectory());
    newHost.setDefaultLibFileName(previousHost.getDefaultLibFileName(options.compilerOptions));
    newHost.setDefaultLibLocation(previousHost.getDefaultLibLocation());
    newHost.setUseCaseSensitiveFileNames(previousHost.useCaseSensitiveFileNames());
    newHost.writeFile = function writeFile(fileName: string, data: string, writeByteOrderMark?: boolean, onError?: (message: string) => void, sourceFiles?: ts.SourceFile[]) {
      this.outputs.set(fileName, data);
      previousHost.writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles);
    }

    return newHost;
  }

  function getDiagnostics() {
    const diagnostics: ts.Diagnostic[] = [];
    const optionsDiagnostics: ts.Diagnostic[] = [];
    const globalDiagnostics: ts.Diagnostic[] = [];
    const syntacticDiagnostics: ts.Diagnostic[] = [];
    const semanticDiagnostics: ts.Diagnostic[] = [];

    optionsDiagnostics.push(...program.getOptionsDiagnostics());
    globalDiagnostics.push(...program.getGlobalDiagnostics());

    for (let sourceFile of program.getSourceFiles().filter(sf => !/\.d\.ts$/.test(sf.fileName))) {
      syntacticDiagnostics.push(...program.getSyntacticDiagnostics(sourceFile));
      semanticDiagnostics.push(...program.getSemanticDiagnostics(sourceFile));
    }

    diagnostics.push(
      ...optionsDiagnostics,
      ...globalDiagnostics,
      ...syntacticDiagnostics,
      ...semanticDiagnostics
    );

    return {
      diagnostics,
      optionsDiagnostics,
      globalDiagnostics,
      syntacticDiagnostics,
      semanticDiagnostics
    };
  }

  function getOutDir(): string {
    if (options.compilerOptions.outFile) {
      return path.dirname(options.compilerOptions.outFile);
    }

    if (options.compilerOptions.outDir) {
      return options.compilerOptions.outDir;
    }

    return commonDir;
  }

  function check(diagnostics: ts.Diagnostic[] | ReadonlyArray<ts.Diagnostic>, log = false, report = true): boolean {
    if (diagnostics && diagnostics.length > 0) {

      if (report) {
        emit(bus.events.DIAGNOSTICS, diagnostics, diagnostics.length);
      }

      if (log) {
        for (let diag of diagnostics) {
          console.error(ts.formatDiagnostics([diag], {
            getCurrentDirectory: () => '',
            getNewLine: () => '\n',
            getCanonicalFileName: (f: string) => f
          }).trim());
        }
      }

      return false;
    }

    return true;
  }

  function emit(event: string | symbol, ...args: any[]): boolean {
    return bus.emit(event, args);
  }

  function getElapsedTime(fromBeginning = false): string {
    if (reflections) {
      return '';
    }

    const time = process.hrtime(fromBeginning ? start : elapsed);
    if (!fromBeginning) elapsed = process.hrtime();
    return format(time, fromBeginning ? 'ms' : void 0);
  }

}
