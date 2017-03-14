import * as ts from 'typescript';

export interface Options {
  compilerOptions?: ts.CompilerOptions;
  keepTempFiles?: boolean;
  tempFolderName?: string;
}

export const defaultOptions: Options = {
  compilerOptions: {
    skipLibCheck: true,
    module: ts.ModuleKind.ES2015,
    target: ts.ScriptTarget.ES2015
  },
  keepTempFiles: true,
  tempFolderName: '.tsr'
};
