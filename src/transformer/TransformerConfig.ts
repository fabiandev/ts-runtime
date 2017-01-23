import { TsRuntimeOptions } from '../options/TsRuntimeOptions';
import { FileResult } from './FileResult';

export interface TransformerConfig {
  files: string[];
  options: TsRuntimeOptions;
}
