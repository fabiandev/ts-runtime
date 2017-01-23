import * as path from 'path';
import { transform } from '../src/index';

const file = path.join(__dirname, 'src/test2.ts');

transform(file);
