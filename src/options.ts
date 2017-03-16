import * as ts from 'typescript';

export interface Options {
  compilerOptions?: ts.CompilerOptions;
  assertAny?: boolean;
  keepTempFiles?: boolean;
  tempFolderName?: string;
}

export const defaultOptions: Options = {
  compilerOptions: {
    skipLibCheck: true,
    module: ts.ModuleKind.ES2015,
    target: ts.ScriptTarget.ES2015
  },
  assertAny: false,
  keepTempFiles: true,
  tempFolderName: '.tsr'
};
