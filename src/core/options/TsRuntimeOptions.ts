import * as ts from 'typescript';

export interface TsRuntimeOptions {
  compilerOptions?: ts.CompilerOptions;
  encoding?: string;
  base?: boolean|string;
  write?: boolean|string;
}

export default TsRuntimeOptions;
