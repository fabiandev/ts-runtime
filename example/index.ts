import * as path from 'path';
import { transform } from '../src/index';
import { Writer } from '../src/writer';

const file = path.join(__dirname, 'src/test2.ts');

transform(file, {
  base: path.join(__dirname, 'src'),
  write: path.join(__dirname, 'dest'),
}).then(transformerResult => {
  (new Writer(transformerResult)).writeAll();
});
