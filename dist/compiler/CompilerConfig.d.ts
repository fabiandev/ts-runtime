import CompilerMode from './CompilerMode';
import TransformerConfig from './transformers/TransformerConfig';
export interface CompilerConfig extends TransformerConfig {
    files?: string[];
    encoding?: string;
    mode?: CompilerMode;
    visitChildrenFirst?: boolean;
}
export default CompilerConfig;
