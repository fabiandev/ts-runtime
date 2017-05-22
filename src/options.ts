import * as ts from 'typescript';

export interface Options {
  compilerOptions?: ts.CompilerOptions;
  finishOnError?: boolean;
  keepTempFiles?: boolean;
  tempFolderName?: string;
  libIdentifier?: string;
  libNamespace?: string;
  log?: boolean;
}

export const defaultOptions: Options = {
  compilerOptions: {
    module: ts.ModuleKind.ES2015,
    target: ts.ScriptTarget.ESNext,
    strictNullChecks: true,
    experimentalDecorators: true,
    // emitDecoratorMetadata: true,
  },
  finishOnError: false,
  keepTempFiles: true,
  tempFolderName: '.tsr',
  libIdentifier: 't',
  libNamespace: '_',
  log: true,
};
