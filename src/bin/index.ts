#!/usr/bin/env node

import './handlers';
import * as program from 'commander';
import transform from '../transform';
import { Config } from '../config';
import { CompilerResult } from '../compiler';
import { Writer, WriterConfig, DEFAULT_CONFIG as DEFAULT_WRITER_CONFIG } from '../writer';
import { bus } from '../bus';
import * as status from './status';

const pkg = require('../../package.json');
const config: Config = {};
const writerConfig: WriterConfig = DEFAULT_WRITER_CONFIG;
let write: boolean = false;

function defaultAction() {
  const files: string[] = program.args.filter((value) => {
    return typeof value === 'string';
  });

  transform(files)
    .then((compilerResult: CompilerResult) => {
      if (write) {
        const writer = new Writer(compilerResult);
        writer.writeAll();
      }
    });
}

function setNoAssertConst() {
  config.assertConst = true;
}

function setEncoding(encoding: string) {
  config.encoding = encoding;
  writerConfig.encoding = encoding;
}

function setWrite(location: string, base?: string) {
  write = true;
  writerConfig.writePath = location || writerConfig.writePath;
  writerConfig.basePath = base || writerConfig.basePath;
}

program
  .version(pkg.version)
  .description(`---------  ts-runtime  ---------
  Inserts runtime type checks and
  emits pretty printed TypeScript.
  --------------------------------`)
  .usage('[options] <file ...>')
  .option('-w, --write', 'persist files', setWrite)
  .option('-e, --encoding <encoding>', 'set file encoding. defaults to utf8', setEncoding)
  .option('--no-assert-const', 'turn off const declaration checks.', setNoAssertConst)
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
} else {
  defaultAction();
}
