import * as ts from 'typescript';

export interface TsRuntimeOptions {
  compilerOptions?: ts.CompilerOptions;
  encoding?: string;
  basePath?: boolean|string;
  writePath?: boolean|string;
}

export default TsRuntimeOptions;
