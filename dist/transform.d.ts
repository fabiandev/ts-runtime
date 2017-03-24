import { CompilerResult } from './compiler';
import { Config } from './config';
export declare function transform(files?: string | string[], config?: Config): Promise<CompilerResult>;
export default transform;
