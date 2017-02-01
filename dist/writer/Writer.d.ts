import { CompilerResult, FileResult } from '../compiler';
import WriterConfig from './WriterConfig';
import WriterResult from './WriterResult';
export declare class Writer {
    private transformerResult;
    constructor(transformerResult: CompilerResult);
    writeAll(config?: WriterConfig): Promise<WriterResult[]>;
    writeFile(fileResult: FileResult, config?: WriterConfig): Promise<WriterResult>;
}
export default Writer;
