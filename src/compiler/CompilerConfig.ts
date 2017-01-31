import CompilerMode from './CompilerMode';
import TransformerConfig from './transformers/TransformerConfig';
import FileResult from './FileResult';

export interface CompilerConfig extends TransformerConfig {
  files?: string[];
  encoding?: string;
  mode?: CompilerMode;
  visitChildrenFirst?: boolean;
}

export default CompilerConfig;
