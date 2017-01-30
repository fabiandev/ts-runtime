import * as ts from 'typescript';
import { CompilerConfig } from '../compiler/CompilerConfig';

export interface Config extends CompilerConfig {
  compilerOptions?: ts.CompilerOptions;
  encoding?: string;
}

export default Config;
