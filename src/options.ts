import * as ts from 'typescript';

export interface Options {
  compilerOptions?: ts.CompilerOptions;
  annotate?: boolean;
  finishOnError?: boolean;
  keepTemp?: boolean;
  tempFolderName?: string;
  libIdentifier?: string;
  libNamespace?: string;
  declarationFile?: string;
  log?: boolean;
  stackTrace?: number;
}

export const defaultOptions: Options = {
  compilerOptions: {
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    module: ts.ModuleKind.ES2015,
    target: ts.ScriptTarget.ES2015,
    lib: ["lib.es2015.d.ts"],
    strictNullChecks: true,
    experimentalDecorators: true,
    sourceMap: false,
    removeComments: true,
    preserveConstEnums: true,
  },
  annotate: true,
  finishOnError: false,
  keepTemp: true,
  tempFolderName: '.tsr',
  libIdentifier: 't',
  libNamespace: '_',
  declarationFile: 'tsr-declarations',
  log: true,
  stackTrace: 3
};
