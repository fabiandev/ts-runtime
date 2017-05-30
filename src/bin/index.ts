#!/usr/bin/env node
Error.stackTraceLimit = Infinity;

import './handlers';
import * as path from 'path';
import * as ts from 'typescript';
import * as program from 'commander';
import { ProgramError } from '../errors';
import { Options, defaultOptions } from '../options';
import { transform, getOptions } from '../transform';
import * as bus from '../bus';
import * as util from './util';

const pkg = require('../../package.json');
const options: Options = Object.assign({}, defaultOptions);
let compilerOptions: string = '{}';

function defaultAction() {
  const files: string[] = program.args
    .filter(arg => typeof arg === 'string')
    .map(file => path.normalize(file));

  if (files.length === 0) {
    throw new ProgramError('No entry file passed to transform.');
  }

  const entryFile: string = files[0];
  const basePath = path.dirname(entryFile);

  options.log = false;

  const opts = ts.convertCompilerOptionsFromJson(JSON.parse(compilerOptions), basePath);

  options.compilerOptions = opts.options;

  bus.emitter.emit(bus.events.INTERNAL_OPTIONS, options);

  if (opts.errors.length > 0) {
    bus.emitter.emit(bus.events.DIAGNOSTICS, [opts.errors]);
    bus.emitter.emit(bus.events.ERROR);
    return;
  }

  transform(entryFile, options);
  process.exit();
}

function setFinishOnError() {
  options.finishOnError = true;
}

function setKeepTempFiles() {
  options.keepTempFiles = true;
}

function setTempFolder(name: string) {
  options.tempFolderName = name;
}

function setLib(lib: string) {
  options.libNamespace = lib;
}

function setNamespace(namespace: string) {
  options.libNamespace = namespace;
}

function setCompilerOptions(opts: string) {
  compilerOptions = opts;
}

function setStackTrace(limit?: number) {
  options.stackTrace = limit !== 0 && !limit ? 3 : limit;
}

program
  .version(pkg.version, '-v, --version')
  .description(`---------  ts-runtime  ---------
  Inserts runtime type checks for
  your  TypeScript  applications.
  --------------------------------`)
  .usage('[options] <file>')
  .option('-c, --compiler-options <compilerOptions>', 'set TypeScript compiler options. defaults to {}', setCompilerOptions)
  .option('-f, --force', 'try to finish on TypeScript compiler error. defaults to false', setFinishOnError)
  .option('-k, --keep-temp-files', 'keep temporary files. default to false', setKeepTempFiles)
  .option('-l, --lib <name>', 'lib import name. defaults to t', setLib)
  .option('-n, --namespace <namespace>', 'prefix for lib and code additions. defaults to _', setNamespace)
  .option('-s, --stack-trace [limit]', 'show stack trace of errors with an optional limit. defaults to 3', setStackTrace)
  .option('-t, --temp-folder <name>', 'set folder name for temporary files. defaults to .tsr', setTempFolder)
  .on('--help', () => {
    console.log('  Examples:');
    console.log();
    console.log('    $ tsr entry.ts');
    console.log('    $ tsr entry.ts --force');
    console.log('    $ tsr -c \'{ "strictNullChecks": "true" }\' entry.ts');
    console.log();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit();
} else {
  defaultAction();
}
