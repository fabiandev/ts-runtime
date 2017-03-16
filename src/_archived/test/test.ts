import * as ts from "typescript";

export function runNameofOnFiles(filePaths: string[]) {
  const results: { fileName: string; text: string; }[] = [];
  const compilerOptions: ts.CompilerOptions = {
    strictNullChecks: true,
    target: ts.ScriptTarget.ES2017
  };
  const transformers: ts.CustomTransformers = {
    before: [nameofTransformFactory],
    after: []
  };
  const program = ts.createProgram(filePaths, compilerOptions);
  program.emit(undefined, (fileName, text) => results.push({ fileName, text }), undefined, false, transformers);

  return results;
}
