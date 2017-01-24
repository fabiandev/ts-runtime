import * as path from 'path';
import { WriterConfig } from './WriterConfig';

export const config: WriterConfig = {
  basePath: path.join(__dirname, 'src'),
  writePath: path.join(__dirname, 'dist'),
};
