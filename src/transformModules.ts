import * as ts from 'typescript';
import * as util from './util';
import * as bus from './bus';
import { ProgramError } from './errors';
import { MutationContext } from './context';
import { getMutators } from './mutators';
import { Options, defaultOptions } from './options';
import { Scanner, TsrDeclaration } from './scanner';

export type FileReflection = {
  [index: string]: string;
  name: string;
  text: string;
};

export function transformModules(sources: FileReflection[], options?: Options): FileReflection[] {
  return transformProgram(sources, options);
}

export function transformModule(source: string, options?: Options, name?: string): FileReflection[] {
  return transformProgram([
    {
      name: name ? name : 'module.ts',
      text: source
    }
  ], options);
}

function transformProgram(sources: FileReflection[], options?: Options): FileReflection[] {
  const opts = Object.assign({}, defaultOptions, options);
  opts.compilerOptions = Object.assign({}, defaultOptions.compilerOptions, options && options.compilerOptions || {});
  options = opts;

  setCompilerOptions();

  let roots = sources.map(source => {
    return ts.createSourceFile(
      source.name, source.text, options.compilerOptions.target, true, ts.ScriptKind.TS
    );
  });

  let fileMap = new Map<string, ts.SourceFile>(roots.map(sf => {
    return [sf.fileName, sf] as [string, ts.SourceFile];
  }));

  let rootNames = Array.from(fileMap.keys());

  const outputs: Map<string, string> = new Map();

  let host: ts.CompilerHost;
  let program: ts.Program;
  let scanner: Scanner;
  let context: MutationContext;
  let currentSourceFile: ts.SourceFile;
  let sourceFiles: ts.SourceFile[];

  return startTransformation();

  function startTransformation(): FileReflection[] {
    let sourceFiles: ts.SourceFile[];

    host = {
      getSourceFile: (fileName) => {
        return fileMap.get(fileName)
      },
      getDefaultLibFileName: () => "lib.d.ts",
      getCurrentDirectory: () => "",
      getDirectories: () => [],
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
      fileExists: (fileName) => fileMap.has(fileName),
      readFile: (fileName) => fileMap.has(fileName) ? fileMap.get(fileName).text : undefined,
      writeFile: (fileName, text) => outputs.set(fileName, text),
    };

    program = ts.createProgram(rootNames, options.compilerOptions, host);
    sourceFiles = program.getSourceFiles().filter(sf => !sf.isDeclarationFile);

    const diagnostics: ts.Diagnostic[] = [];

    diagnostics.push(...program.getOptionsDiagnostics());
    diagnostics.push(...program.getGlobalDiagnostics());

    for (let sourceFile of program.getSourceFiles().filter(sf => !/\.d\.ts$/.test(sf.fileName))) {
      diagnostics.push(...program.getSyntacticDiagnostics(sourceFile));
      diagnostics.push(...program.getSemanticDiagnostics(sourceFile));
    }

    if (diagnostics.length > 0) {
      for (let diag of diagnostics) {
        console.error(ts.formatDiagnostics([diag], {
          getCurrentDirectory: () => '',
          getNewLine: () => '\n',
          getCanonicalFileName: (f: string) => f
        }));
      }
    }

    scanner = new Scanner(program, options);

    const result = ts.transform(sourceFiles, [transformer], options.compilerOptions);

    const printHandlers: ts.PrintHandlers = {
      substituteNode(hint: ts.EmitHint, node: ts.Node): ts.Node {
        return node;
      }
    };

    const printer = ts.createPrinter(undefined, printHandlers);

    roots = result.transformed.map(transformed => {
      return ts.createSourceFile(
        transformed.fileName, printer.printFile(transformed), options.compilerOptions.target, true, ts.ScriptKind.TS
      );
    });

    result.dispose();
    let outputsResult: FileReflection[] = [];

    if (options.compilerOptions.noEmit) {
      roots.forEach(sf => {
        outputsResult.push({ name: sf.fileName, text: sf.text });
      })
    } else {
      options.compilerOptions.noEmit = false;

      fileMap = new Map<string, ts.SourceFile>(roots.map(sf => {
        return [sf.fileName, sf] as [string, ts.SourceFile];
      }));

      rootNames = Array.from(fileMap.keys());

      program = ts.createProgram(rootNames, options.compilerOptions, host);
      sourceFiles = program.getSourceFiles().filter(sf => !sf.isDeclarationFile);

      program.emit(/*targetSourceFile*/ undefined, host.writeFile, /*cancellationToken*/ undefined, /*emitOnlyDtsFiles*/ false);

      outputs.forEach((value: string, key: string) => {
        outputsResult.push({ name: key, text: value });
      })
    }

    const declarations = getDeclarations();

    if (declarations) {
      outputsResult.push(declarations);
    }

    return outputsResult;
  };

  function createMutationContext(node: ts.Node, transformationContext: ts.TransformationContext): void {
    if (!node) {
      return;
    }
    if (ts.isSourceFile(node) && currentSourceFile !== node) {
      currentSourceFile = node;
      context = new MutationContext(node, options, program, host, scanner, transformationContext, rootNames, '');
    }
  }

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
        node.parent = original.parent;
        util.setParent(node);
      }

      for (let mutator of getMutators()) {
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

  function getDeclarations(): FileReflection {
    const filename = `${options.declarationFileName}.js`;

    const printerOptions: ts.PrinterOptions = {
      removeComments: false
    };

    const printHandlers: ts.PrintHandlers = {
      substituteNode(hint: ts.EmitHint, node: ts.Node): ts.Node {
        node.parent = undefined;
        node.flags = ts.NodeFlags.Synthesized;
        return node;
      }
    };

    const printer = ts.createPrinter(printerOptions, printHandlers);

    let sf = ts.createSourceFile(filename, '', options.compilerOptions.target, true, ts.ScriptKind.TS);

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
            declarations[i].symbol.getDeclarations()
          )
        );
      }

      processed = length;
    } while (length !== scanner.getDeclarations().length);

    if (expressions.length < 1) {
      return;
    }

    sf = ts.updateSourceFileNode(sf, [
      context.factory.importLibStatement(),
      ...expressions.map(exp => {
        return ts.createStatement(exp);
      })
    ]);

    const printed = printer.printFile(sf);
    const transpiled = ts.transpile(printed, options.compilerOptions);

    return {
      name: filename,
      text: transpiled
    }
  }

  function setCompilerOptions() {
    if (!options.compilerOptions.preserveConstEnums) {
      options.compilerOptions.preserveConstEnums = true;
      console.warn('Compiler option "preserveConstEnums" was enabled.');
    }
    if (!options.compilerOptions.noLib) {
      options.compilerOptions.noLib = true;
      options.compilerOptions.lib = undefined;
      console.warn('Compiler option "noLib" was enabled.');
    }
    if (!options.compilerOptions.rootDir) {
      options.compilerOptions.rootDir = '';
    }
  }

}
