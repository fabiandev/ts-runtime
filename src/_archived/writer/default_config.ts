import WriterConfig from './WriterConfig';

export const DEFAULT_CONFIG: WriterConfig = {
  basePath: process.cwd(),
  writePath: process.cwd(),
  encoding: 'utf8',
};

export default DEFAULT_CONFIG;
