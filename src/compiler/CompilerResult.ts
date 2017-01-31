import FileResult from './FileResult';
import { Config } from '../config';

export interface CompilerResult {
  config: Config;
  fileResults: FileResult[];
}

export default CompilerResult;
