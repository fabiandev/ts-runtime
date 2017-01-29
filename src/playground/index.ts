import * as path from 'path';
import * as tsr from '../index';
import { Writer, WriterConfig } from '../writer';

const file = path.join(__dirname, 'test.ts');

const writerConfig: WriterConfig = {
  basePath: __dirname,
  writePath: __dirname,
};

tsr.transform(file).then(transformerResult => {
  const writer = new Writer(transformerResult);
  writer.writeAll(writerConfig);
});
