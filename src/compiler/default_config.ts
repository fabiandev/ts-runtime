import DEFAULT_TRANSFORMER_CONFIG from './transformers/default_config';
import CompilerMode from './CompilerMode';
import CompilerConfig from './CompilerConfig';

export const DEFAULT_CONFIG: CompilerConfig = Object.assign({},
  {
    files: [],
    encoding: 'utf8',
    mode: CompilerMode.Substitute,
    visitChildrenFirst: false,
  }, DEFAULT_TRANSFORMER_CONFIG);

export default DEFAULT_CONFIG;
