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

const DEBUG = false;

export enum ProgramState {
  None,
  FirstPass,
  Transform
}

export function transform(entryFile: string, options?: Options): void {
  return transformProgram(entryFile, options) as void;
}

// export function transformModule(source: string, options?: Options, autoStart = true): string {
//   return transformProgram(source, options, autoStart, true) as string;
// }

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

  // console.log('basePath', basePath);
  // console.log('entryFile', entryFile);

  return startTransformation();

  // function startModuleTransformation(): string {
  //   let sourceFile = ts.createSourceFile('transformed.ts', entryFile, options.compilerOptions.target, true, ts.ScriptKind.TS);
  //   host = ts.createCompilerHost(options.compilerOptions, true);
  //
  //   const typedResult = ts.transform(sourceFile, [firstPassTransformer], options.compilerOptions);
  //   typedResult.dispose();
  //
  //   const result = ts.transform(typedResult.transformed[0], [transformer], options.compilerOptions);
  //   const source = result.transformed[0].getText();
  //   result.dispose();
  //
  //   return source;
  // }

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
      if (!options.keepTempFiles) deleteTempFiles();
      emit(bus.events.STOP);
      return;
    }

    sourceFiles = program.getSourceFiles().filter(sf => !sf.isDeclarationFile);
    scanner = new Scanner(program, ProgramState.FirstPass);

    emit(bus.events.TRANSFORM, sourceFiles);

    const typedResult = ts.transform(sourceFiles, [firstPassTransformer], options.compilerOptions);
    writeTempFiles(typedResult);

    createProgramFromTempFiles();

    sourceFiles = program.getSourceFiles().filter(sf => !sf.isDeclarationFile);
    scanner = new Scanner(program, ProgramState.Transform);

    const result = ts.transform(sourceFiles, [transformer], options.compilerOptions);

    writeTempFiles(result);

    // do not check post-diagnostics of temp file
    // check(result.diagnostics, options.log)

    if (!emitTransformed() && !options.finishOnError) {
      if (!options.keepTempFiles) deleteTempFiles();
      emit(bus.events.STOP);
      return;
    }

    emit(bus.events.CLEANUP);

    if (!options.keepTempFiles) {
      deleteTempFiles();
    }

    emitDeclarations();

    typedResult.dispose();
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
    // console.log()
    // console.log()
    // console.log(path.resolve(getTempPath(basePath, options.tempFolderName)))
    // console.log(path.resolve(tempEntryFile))

    tempEntryFile = toTempFilePath(tempEntryFile, basePath, options.tempFolderName);
    tempBasePath = getTempPath(tempBasePath, options.tempFolderName);
    // console.log(tempBasePath);
    // console.log(tempEntryFile);

    // console.log('---')
    // console.log(path.resolve(basePath))
    // console.log(path.resolve(tempEntryFile))
    // console.log();
    options.compilerOptions.rootDir = tempBasePath;

    host = ts.createCompilerHost(options.compilerOptions);
    program = ts.createProgram([tempEntryFile], options.compilerOptions, host, undefined);
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
      const location = toTempFilePath(transformed.fileName, basePath, options.tempFolderName);
      const source = printer.printFile(transformed);
      ts.sys.writeFile(location, source);
    }
  }

  function emitTransformed(): boolean {
    // options.compilerOptions.rootDir = tempBasePath;
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
    const filename = '_tsr-declarations.js';
    const outDir = path.join(getOutDir(), filename);
    const printer = ts.createPrinter();

    let sf = ts.createSourceFile(filename, '', ts.ScriptTarget.ES2015, true, ts.ScriptKind.JS);

    const declarations = scanner.getDeclarations();
    const expressions: ts.Expression[] = [];


    declarations.forEach((ids, key) => {
      let firstDeclaration: ts.Declaration = key.getDeclarations()[0];
      let expression: ts.Expression = getDeclaration(firstDeclaration, ids[0]);

      if (expression) {
        expressions.push(expression);

        for (let i = 1; i < ids.length; i++) {
          expressions.push(context.factory.typeAliasReflection(ids[i], context.factory.libCall('ref', ts.createLiteral(ids[0]))));
        }
      }

    });

    sf = ts.updateSourceFileNode(sf, expressions.map(exp => {
      return ts.createStatement(context.factory.libCall('declare', exp));
    }))

    ts.sys.writeFile(outDir, printer.printFile(sf));
  }

  function getDeclaration(declaration: ts.Declaration, name: string): ts.Expression {
    switch (declaration.kind) {
      case ts.SyntaxKind.InterfaceDeclaration:
        return context.factory.typeAliasReflection(name, context.factory.typeLiteralReflection(declaration as ts.InterfaceDeclaration));
      case ts.SyntaxKind.ClassDeclaration:
        return context.factory.typeAliasReflection(name, context.factory.typeLiteralReflection(declaration as ts.InterfaceDeclaration), 'class');
      case ts.SyntaxKind.TypeLiteral:
        return context.factory.typeAliasReflection(name, context.factory.typeLiteralReflection(declaration as ts.InterfaceDeclaration));
      case ts.SyntaxKind.EnumDeclaration:
        return context.factory.typeAliasReflection(name, context.factory.enumReflection(declaration as ts.EnumDeclaration));
      case ts.SyntaxKind.EnumMember:
        return context.factory.enumMemberReflection(declaration as ts.EnumMember);
      case ts.SyntaxKind.FunctionDeclaration:
        context.factory.typeAliasReflection(name, context.factory.functionTypeReflection(declaration as ts.FunctionTypeNode));
      case ts.SyntaxKind.VariableDeclaration:
        return context.factory.libCall('var', [ts.createLiteral((declaration as ts.VariableDeclaration).name.getText()), context.factory.typeReflection((declaration as ts.VariableDeclaration).type)]);
      case ts.SyntaxKind.TypeAliasDeclaration:
        return context.factory.typeAliasDeclarationReflection(declaration as ts.TypeAliasDeclaration, name);
      case ts.SyntaxKind.TypeParameter:
        console.log(declaration.parent.getText())
        return null;
      default:
        throw new ProgramError(`Could not reflect declaration for ${ts.SyntaxKind[declaration.kind]}`);
    }
  }

  function createMutationContext(node: ts.Node, transformationContext: ts.TransformationContext): void {
    if (node.kind === ts.SyntaxKind.SourceFile && currentSourceFile !== node) {
      currentSourceFile = node as ts.SourceFile;
      context = new MutationContext(node as ts.SourceFile, options, program, host, scanner, transformationContext);
    }
  }

  function firstPassTransformer(transformationContext: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    const visited: ts.Node[] = [];

    const declarationCanHaveType = (node: ts.Node) => {
      let current: ts.Node = node;

      if (current.kind === ts.SyntaxKind.VariableDeclaration && current.parent) {
        current = current.parent;
      }

      if (current.kind === ts.SyntaxKind.VariableDeclarationList && current.parent) {
        current = current.parent;
      }

      switch (current.kind) {
        case ts.SyntaxKind.ForOfStatement:
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.CatchClause:
        case ts.SyntaxKind.ImportClause:
          return false;
      }

      return true;
    };

    const getImplicitTypeNode = (node: ts.Node) => {
      // TODO: get widened/apparent type?
      const type = context.checker.getTypeAtLocation(node);
      const typeNode = type ? context.checker.typeToTypeNode(type, node.parent) : void 0;
      //
      // type.symbol && type.symbol.members && type.symbol.members.forEach(s => {
      //   console.log(context.checker.getDeclaredTypeOfSymbol(s))
      // })
      // console.log(type.symbol.getDeclarations().map(d => ));

      //console.log(context.checker.typeToString(context.checker.getTypeFromTypeNode(typeNode), node.parent))
      return typeNode;
      // const typeNode = context.scanner.getAttributes((node as any).name || node).typeNode;
      // return typeNode;
    }

    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
      if (!node || context.wasVisited(node)) {
        return node;
      }

      // if (node.kind === ts.SyntaxKind.AsExpression) {
      //   return context.addVisited(
      //     context.factory.typeReflectionAndAssertion(
      //       (node as ts.AsExpression).type,
      //       (node as ts.AsExpression).expression
      //     ), true, (node as ts.AsExpression).expression);
      // }

      if (node && !(node as any).type) {
        let type: ts.TypeNode;
        switch (node.kind) {
          case ts.SyntaxKind.Parameter:
          case ts.SyntaxKind.PropertySignature:
          case ts.SyntaxKind.PropertyDeclaration:
          case ts.SyntaxKind.MethodSignature:
          case ts.SyntaxKind.CallSignature:
          case ts.SyntaxKind.ConstructSignature:
          case ts.SyntaxKind.IndexSignature:
            // type = getImplicitTypeNode(node);
            type = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
            break;
          case ts.SyntaxKind.VariableDeclaration:
            if (declarationCanHaveType(node)) {
              // type = getImplicitTypeNode(node);
              type = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
            }
            break;
          case ts.SyntaxKind.MethodDeclaration:
          // case ts.SyntaxKind.Constructor:
          case ts.SyntaxKind.GetAccessor:
          // case ts.SyntaxKind.SetAccessor:
          case ts.SyntaxKind.FunctionExpression:
          case ts.SyntaxKind.ArrowFunction:
          case ts.SyntaxKind.FunctionDeclaration:
            // type = getImplicitTypeNode(node);
            // type = type && ((type as any).type || type);
            type = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
            break;
        }

        if (type) {
          (node as any).type = type;
          util.setParent(node);
        }
      }

      // check if isDeclared
      // if not add to top with name
      // if yes, rename type reference
      // add to top
      // if (node.kind === ts.SyntaxKind.TypeReference) {
      //   console.log();
      //   const ref = node as ts.TypeReferenceNode;
      //
      //   let name = util.getIdentifierOfQualifiedName(ref.typeName);
      //   console.log(name.getText());
      //
      //   const isDeclared = context.isDeclared(name);
      //   console.log(!!isDeclared);
      //   if (!isDeclared) {
      //     const sourceFile = node.getSourceFile();
      //     let lastImport = -1;
      //     let reflection: ts.Expression;
      //
      //     for (let i = 0; i < sourceFile.statements.length; i++) {
      //       if (sourceFile.statements[i].kind === ts.SyntaxKind.ImportDeclaration) {
      //         lastImport = i;
      //       }
      //     }
      //
      //     // console.log(ref.typeName);
      //     console.log(node.getSourceFile().fileName);
      //
      //
      //     // splice(lastImport + 1, 0, item)
      //   }
      //   console.log();
      //
      // }

      context.addVisited(node);
      return ts.visitEachChild(node, visitor, transformationContext);
    };

    return (sf: ts.SourceFile) => {
      createMutationContext(sf, transformationContext);
      return ts.visitNode(sf, visitor);
    };
  }

  function transformer(transformationContext: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
      const original = node;

      node = ts.visitEachChild(node, visitor, transformationContext);

      if (node !== original) {
        context.scanner.mapNode(original, node);
      }

      debugText('~~~~~~~~~~~~~~~~~~~~~');
      debugText('Before Mutation:');
      debugText('~~~~~~~~~~~~~~~~~~~~~');
      debugNodeAttributes(node, context);
      debugNodeText(node, context);

      for (let mutator of mutators) {
        let previous = node;

        node = mutator.mutateNode(node, context);

        if (node !== previous) {
          context.scanner.mapNode(previous, node);
        }
      }

      if (!node) {
        return node;
      }

      if (!node.parent) {
        node.parent = original.parent;
      }

      // if (node.kind === ts.SyntaxKind.ClassDeclaration) {
      //   console.log();
      //   console.log((node as any).name.getText());
      //   console.log(node.parent.getText());
      //   console.log(!!node.parent, (node as any).parent.statements.length);
      // }

      util.setParent(node);
      // context.addVisited(node);

      debugSpaces();
      debugText('~~~~~~~~~~~~~~~~~~~~~');
      debugText('After Mutation:');
      debugText('~~~~~~~~~~~~~~~~~~~~~');
      debugNodeAttributes(node, context);
      debugNodeText(node, context);
      debugSpaces(3);

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

    emit(bus.events.DIAGNOSTICS, diagnostics.slice(0, 15), diagnostics.length);

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

function debugText(text: string): void {
  if (!DEBUG) return;
  console.log(text);
}

function debugSpaces(spaces: number = 1): void {
  if (!DEBUG) return;
  console.log(Array(Math.abs(spaces) + 1).join('\n'));
}

function debugNodeAttributes(node: ts.Node, context: MutationContext): void {
  if (!DEBUG) return;
  console.log(`Kind: ${ts.SyntaxKind[node.kind]} (${node.kind})`);
  try {
    console.log(`Implicit Type: ${context.scanner.getInfo(node).typeNode}`);
  } catch (e) {
    console.log('Implicit Type:');
  }
  console.log(`Visited: ${context.wasVisited(node) ? 'Yes' : 'No'}`);
  // console.log(`Scope: ${scopeKind}`);
  console.log(`Synthesized: ${node.flags === ts.NodeFlags.Synthesized ? 'Yes' : 'No'}`);
  console.log(`File: ${context.sourceFile.fileName}`);
}

function debugNodeText(node: ts.Node, mutstionContext: MutationContext): void {
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
