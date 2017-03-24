import * as ts from 'typescript';

function transform(options: ts.CompilerOptions, fileNames: string[], allDiagnostics: ts.Diagnostic[]): any {
  const files = new Map<string, string>();
  const program = ts.createProgram(fileNames, options);

  {
    const diagnostics = ts.getPreEmitDiagnostics(program);
    if (diagnostics.length > 0) {
      allDiagnostics.push(...diagnostics);
      logDiagnostics(allDiagnostics);
      return null;
    }
  }

  const emitResult = program.emit(undefined);

  if (emitResult.diagnostics.length > 0) {
    allDiagnostics.push(...emitResult.diagnostics);
    logDiagnostics(allDiagnostics);
    return null;
  }

  const exitCode = emitResult.emitSkipped ? 1 : 0;
  console.log(`Process exiting with code '${exitCode}'.`);

  return emitResult;
}

function logDiagnostics(allDiagnostics: ts.Diagnostic[]) {
  allDiagnostics.forEach(diagnostic => {
    let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  });
}

const emitResult = transform({}, ['test1.ts'], []);
