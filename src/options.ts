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
    skipLibCheck: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2015,
    strictNullChecks: false,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  },
  finishOnError: false,
  keepTempFiles: true,
  tempFolderName: '.tsr',
  libIdentifier: 't',
  libNamespace: '_',
  log: true,
};
