import * as ts from 'typescript';

export interface Options {
  compilerOptions?: ts.CompilerOptions;
  encoding?: string;
  basePath?: boolean|string;
  writePath?: boolean|string;
}

export default Options;
