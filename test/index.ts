import * as path from 'path';
import { transform } from '../src/index';
import { Writer } from '../src/writer';

const file = path.join(__dirname, 'src/test2.ts');
const basePath = path.join(__dirname, 'src');
const writePath = path.join(__dirname, 'dest');

transform(file)
.then(transformerResult => {
  const writer = new Writer(transformerResult);
  writer.writeAll({
    basePath,
    writePath,
  });
});
