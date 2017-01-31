import * as path from 'path';
import * as tsr from '../index';
import { Config } from '../config';
import { Writer, WriterConfig } from '../writer';

const file = path.join(__dirname, 'test1.ts');

const writerConfig: WriterConfig = {
  basePath: __dirname,
  writePath: __dirname,
};

tsr.transform(file).then(compilerResult => {
  const writer = new Writer(compilerResult);
  writer.writeAll(writerConfig);
});
