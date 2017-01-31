#!/usr/bin/env node

import './handlers';
import * as program from 'commander';
import transform from '../transform';
import { bus } from '../bus';
import * as status from './status';

const pkg = require('../../package.json');

function defaultAction(env: any, options: any) {
  const files: string[] = program.args.filter((value) => {
    return typeof value === 'string';
  });

  transform(files);
}

function setNoAssertConst() {

}

function setEncoding(encoding: string) {

}

program
  .version(pkg.version)
  .description(`---------  ts-runtime  ---------
  Inserts runtime type checks and
  emits pretty printed TypeScript.
  --------------------------------`)
  .usage('[options] <file ...>')
  .option('-w, --write <location> [base]', 'persist files')
  .option('-e, --encoding <encoding>', 'set file encoding. defaults to utf8', setEncoding)
  .option('--no-assert-const', 'turn off const declaration checks.', setNoAssertConst)
  .action(defaultAction)
  .on('--help', () => {
    console.log('  Examples:');
    console.log();
    console.log('    $ tsr --no-assert-const file.ts');
    console.log('    $ tsr --write ./out ./src ./src/file1.ts ./src/file2.ts');
    console.log();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
