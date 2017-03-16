import * as path from 'path';
import * as tsr from '../../next/';

tsr.transform(path.join(__dirname, './source4.ts'), {
  compilerOptions: {}
});
