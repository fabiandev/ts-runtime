import { FileResult } from './FileResult';
import { TransformerConfig } from './TransformerConfig';

export interface TransformerResult {
  config: TransformerConfig;
  fileResults: FileResult[];
}
