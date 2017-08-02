import * as ts from 'typescript';

export interface Options {
  [index: string]: any;
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
    preserveConstEnums: true,
    experimentalDecorators: true
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
