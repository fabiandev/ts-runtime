import * as path from 'path';
import { transform } from '../transform';
import { Writer } from '../writer';

const file = path.join(__dirname, 'test.ts');

const writerConfig = {
  basePath: __dirname,
  writePath: __dirname,
};

transform(file)
.then(transformerResult => {
  const writer = new Writer(transformerResult);
  writer.writeAll(writerConfig);
});
