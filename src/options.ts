import * as ts from 'typescript';

export interface Options {
  annotate?: boolean;
  compilerOptions?: ts.CompilerOptions;
  declarationFileName?: string;
  declarationNamespace?: string;
  excludeDeclarationFile?: boolean;
  force?: boolean;
  importDeclarations?: boolean;
  keepTemp?: boolean;
  libIdentifier?: string;
  libNamespace?: string;
  moduleAlias?: boolean;
  stackTraceOutput?: number;
  tempFolderName?: string;
  log?: boolean;
  assertSafe?: true;
  assertAny?: false;
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
  declarationFileName: 'tsr-declarations',
  excludeDeclarationFile: false,
  log: true,
  stackTraceOutput: 3,
  moduleAlias: false,
};
