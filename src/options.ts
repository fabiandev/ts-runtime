import * as ts from 'typescript';

export interface Options {
  compilerOptions?: ts.CompilerOptions;
  assertAny?: boolean;
  keepTempFiles?: boolean;
  tempFolderName?: string;
  libIdentifier?: string;
  typeIdentifierNamespace?: string;
}

export const defaultOptions: Options = {
  compilerOptions: {
    skipLibCheck: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES5,
    strictNullChecks: false
  },
  assertAny: false,
  keepTempFiles: true,
  tempFolderName: '.tsr',
  libIdentifier: 't',
  typeIdentifierNamespace: '_'
};
