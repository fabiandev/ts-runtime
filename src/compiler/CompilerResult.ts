import FileResult from './FileResult';
import CompilerConfig from './CompilerConfig';

export interface CompilerResult {
  config: CompilerConfig;
  fileResults: FileResult[];
}

export default CompilerResult;
