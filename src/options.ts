import * as ts from 'typescript';

export interface Options {
  libDeclarations?: boolean;
  noAnnotate?: boolean;
  compilerOptions?: ts.CompilerOptions;
  declarationFileName?: string;
  force?: boolean;
  excludeDeclarationFile?: boolean;
  excludeLib?: boolean;
  keepTemp?: boolean;
  libIdentifier?: string;
  libNamespace?: string;
  declarationPrefix?: string;
  moduleAlias?: boolean;
  stackTraceOutput?: number;
  tempFolderName?: string;
  log?: boolean;
  assertSafe?: true;
  assertAny?: false;
}

export const defaultOptions: Options = {
  noAnnotate: false,
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
  libDeclarations: false,
  declarationFileName: 'tsr-declarations',
  force: false,
  excludeDeclarationFile: false,
  excludeLib: false,
  keepTemp: false,
  libIdentifier: 't',
  libNamespace: '',
  declarationPrefix: '_',
  moduleAlias: false,
  stackTraceOutput: 3,
  tempFolderName: '.tsr',
  log: true,
  assertSafe: true,
  assertAny: false,
};
