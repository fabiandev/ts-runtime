import { FileResult } from '../transformer';

export interface WriteResult {
  fileResult: FileResult;
  originalPath: string;
  writePath: string;
}
