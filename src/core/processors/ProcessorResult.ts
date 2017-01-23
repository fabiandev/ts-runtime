import { TsRuntimeOptions } from '../options/TsRuntimeOptions';

export interface ProcessorResult {
  files: string[];
  options: TsRuntimeOptions;
  result?: any;
}
