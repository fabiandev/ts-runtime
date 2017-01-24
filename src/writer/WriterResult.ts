import { FileResult } from '../compiler';

export interface WriterResult {
  fileResult: FileResult;
  originalPath: string;
  writePath: string;
}
