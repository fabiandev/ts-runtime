import * as path from 'path';
import { transform } from './transform2';

transform(path.join(__dirname, '../test/v2/source.ts'));
