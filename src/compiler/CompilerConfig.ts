import TransformerConfig from './transformers/TransformerConfig';
import FileResult from './FileResult';

export interface CompilerConfig extends TransformerConfig {
  files?: string[];
  mode?: 'substitute' | 'visit';
  visitChildrenFirst?: boolean;
}

export default CompilerConfig;
