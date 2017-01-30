import { DEFAULT_CONFIG as DEFAULT_TRANSFORMER_CONFIG } from './transformers';
import CompilerConfig from './CompilerConfig';

export const DEFAULT_CONFIG: CompilerConfig = Object.assign({},
  {
    files: [],
    mode: 'substitute',
    visitChildrenFirst: false,
  }, DEFAULT_TRANSFORMER_CONFIG);
