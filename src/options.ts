import * as ts from 'typescript';

export interface Options {
  compilerOptions?: ts.CompilerOptions;
  annotate?: boolean;
  assertSafe?: true;
  assertAny?: false;
  finishOnError?: boolean;
  keepTemp?: boolean;
  tempFolderName?: string;
  libIdentifier?: string;
  libNamespace?: string;
  declarationFile?: string;
  excludeDeclarationFile?: boolean;
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
  assertSafe: true,
  assertAny: false,
  finishOnError: false,
  keepTemp: true,
  tempFolderName: '.tsr',
  libIdentifier: 't',
  libNamespace: '_',
  declarationFile: 'tsr-declarations',
  excludeDeclarationFile: false,
  log: true,
  stackTrace: 3
};
