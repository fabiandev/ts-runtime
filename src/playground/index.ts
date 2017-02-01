import * as path from 'path';
import * as tsr from '../index';
import { Config } from '../config';
// import { Writer, WriterConfig } from '../writer';

const file1 = path.join(__dirname, 'test1.ts');
const file2 = path.join(__dirname, 'test.ts');

// const writerConfig: WriterConfig = {
//   basePath: __dirname,
//   writePath: __dirname,
// };

tsr.transform([file1, file2]);

// .then(compilerResult => {
//   const writer = new Writer(compilerResult);
//   writer.writeAll(writerConfig);
// });
