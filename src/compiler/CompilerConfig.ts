import { TsRuntimeOptions } from '../options/TsRuntimeOptions';
import { FileResult } from './FileResult';

export interface CompilerConfig {
  files: string[];
  options: TsRuntimeOptions;
}
