import Options from '../options/Options';
import FileResult from './FileResult';

export interface CompilerConfig {
  files: string[];
  options: Options;
}

export default CompilerConfig;
