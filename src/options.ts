import * as ts from 'typescript';

export interface Options {
  compilerOptions?: ts.CompilerOptions;
  annotate?: boolean;
  assertSafe?: true;
  assertAny?: false;
  force?: boolean;
  importDeclarations?: boolean;
  keepTemp?: boolean;
  tempFolderName?: string;
  libIdentifier?: string;
  libNamespace?: string;
  declarationNamespace?: string;
  declarationFile?: string;
  excludeDeclarationFile?: boolean;
  log?: boolean;
  stackTrace?: number;
  moduleAlias?: boolean;
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
  force: false,
  importDeclarations: true,
  keepTemp: false,
  tempFolderName: '.tsr',
  libIdentifier: 't',
  libNamespace: '_',
  declarationNamespace: '_',
  declarationFile: 'tsr-declarations',
  excludeDeclarationFile: false,
  log: true,
  stackTrace: 3,
  moduleAlias: false,
};
