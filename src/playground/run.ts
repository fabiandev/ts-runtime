import * as path from 'path';
import * as tsr from '../';

const args = process.argv.slice(2);
const file = path.join(__dirname, `./snippets/${args[0]}.ts`);

tsr.transform(file, { keepTempFiles: true });
