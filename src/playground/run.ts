import * as path from 'path';
import * as tsr from '../';

tsr.transform(path.join(__dirname, './snippets/source4.ts'), {
  compilerOptions: {}
});
