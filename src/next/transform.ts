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

  startTransformation();

  function startTransformation(): void {
    notify(bus.events.START, { entryFile, options });

    const basePath = path.dirname(entryFile);

    host = ts.createCompilerHost(options.compilerOptions);
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

    emit();

    if (!options.keepTempFiles) {
      const tempPath = getTempPath(basePath, options.tempFolderName);
      notify(bus.events.TEMP_DELETE_START, { tempPath });
      rimraf.sync(getTempPath(basePath, options.tempFolderName));
      notify(bus.events.TEMP_DELETE_END, { tempPath });
    }

    notify(bus.events.END, { entryFile, options });
  }

  function emit() {
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

  // function firstPassVisitor(node: ts.Node, mc: MutationContext, tc: ts.TransformationContext): void {
  //   if (!node) return;
  //   let checker = program.getTypeChecker();
  //   ts.forEachChild(node, n => {
  //
  //
  //     // let type = checker.getTypeAtLocation(n);
  //     // // console.log('TYPE', type);
  //     // let typeString = checker.typeToString(type);
  //     // console.log('TYPESTRING', typeString);
  //     // let source = `let temp: ${typeString};`;
  //     // console.log('SRC', source);
  //     // console.log('\n\n\n');
  //     // let sf = ts.createSourceFile('temp', source, ts.ScriptTarget.ES2015);
  //     // let typeNode = (sf.statements[0] as ts.VariableStatement).declarationList.declarations[0].type;
  //
  //     switch (n.kind) {
  //       case ts.SyntaxKind.BinaryExpression:
  //         // console.log((n as ts.BinaryExpression).getText());
  //         // let s = program.getTypeChecker().getSymbolAtLocation(n);
  //         // let t = program.getTypeChecker().getContextualType(n as ts.BinaryExpression);
  //         // console.log(s);
  //         // console.log(t);
  //         // console.log('\n\n');
  //         break;
  //       case ts.SyntaxKind.Identifier:
  //         console.log((n as ts.Identifier).text);
  //         console.log('-----------------------');
  //
  //
  //
  //         // let t = checker.getTypeAtLocation(n);
  //         // // console.log(checker.getPropertiesOfType(t));
  //         // // t = checker.getWidenedType(t);
  //         // //
  //         // console.log(ts.TypeFlags[t.flags]);
  //
  //         let type = checker.getTypeAtLocation(n);
  //
  //         let typeString = checker.typeToString(type);
  //         console.log(typeString);
  //         let source = `let temp: ${typeString};`;
  //
  //         let sf = ts.createSourceFile('temp', source, ts.ScriptTarget.ES2015);
  //         let typeNode = (sf.statements[0] as ts.VariableStatement).declarationList.declarations[0].type;
  //
  //         //
  //         // let asm = type.aliasSymbol;
  //         //
  //         // if (asm) {
  //         //   if (asm.declarations && asm.declarations[0]) {
  //         //     console.log(asm.declarations.length);
  //         //     let asmi = asm.declarations[0] as ts.VariableDeclaration;
  //         //     if (asmi.type) {
  //         //       console.log('has type');
  //         //       console.log(ts.SyntaxKind[asmi.type.kind]);
  //         //     }
  //         //   }
  //         // }
  //         //
  //         console.log(ts.TypeFlags[type.flags]);
  //         console.log('\n\n');
  //
  //         // console.log('KIND:', (n as ts.Identifier).text);
  //         // console.log((n as ts.Identifier).originalKeywordKind);
  //         // console.log('');
  //
  //         // if (mc.names.indexOf((n as ts.Identifier).text) === -1) {
  //         //   // mc.names.push((n as ts.Identifier).text);
  //         //   // console.log('KIND:', (n as ts.Identifier).text);
  //         //   // console.log((n as ts.Identifier).originalKeywordKind);
  //         //   // console.log('');
  //         // }
  //         break;
  //       case ts.SyntaxKind.VariableDeclaration:
  //         // const dec = n as ts.VariableDeclaration;
  //         // if (dec.name.kind === ts.SyntaxKind.Identifier) {
  //         //   mc.declarations.set((dec.name as ts.Identifier).text, dec.type);
  //         // }
  //         break;
  //     }
  //
  //     firstPassVisitor(n, mc, tc);
  //   });
  // }

  function transformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    let mutationContext: MutationContext;

    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
      if (node.kind === ts.SyntaxKind.SourceFile) {
        mutationContext = new MutationContext(options, node as ts.SourceFile, program, host);
        // firstPassVisitor(node as ts.SourceFile, mutationContext, context);
      }

      // if (node.kind === ts.SyntaxKind.SourceFile) {
      //   console.log('---------------');
      //   console.log('SourceFile');
      //   console.log((node as ts.SourceFile).fileName);
      //   console.log('---------------\n\n');
      // } else {
      //   console.log(ts.SyntaxKind[node.kind]);
      // }

      const parent = node.parent;
      node = onBeforeVisit(node, mutationContext, context);

      if (DEBUG) {
        const scope = mutationContext.scope ? ts.SyntaxKind[mutationContext.scope.kind] : 'undefined';
        console.log(`Visited: ${mutationContext.wasVisited(node) ? 'Yes' : 'No'}`);
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

  function getOptions(o: Options = {}): Options {
    const opts = Object.assign({}, defaultOptions, o);
    opts.compilerOptions = Object.assign({}, defaultOptions.compilerOptions, o.compilerOptions || {});
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

}
