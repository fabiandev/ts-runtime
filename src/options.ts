import * as ts from 'typescript';

export interface Options {
  compilerOptions?: ts.CompilerOptions;
  keepTempFiles?: boolean;
  tempFolderName?: string;
  libIdentifier?: string;
  typeIdentifierNamespace?: string;
}

export const defaultOptions: Options = {
  compilerOptions: {
    skipLibCheck: true,
    module: ts.ModuleKind.ES2015,
    target: ts.ScriptTarget.ES2015,
    strictNullChecks: false,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  },
  keepTempFiles: true,
  tempFolderName: '.tsr',
  libIdentifier: 't',
  typeIdentifierNamespace: '_'
};
