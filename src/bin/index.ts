#!/usr/bin/env node

import * as path from 'path';
import * as find from 'find-up';
import * as ts from 'typescript';
import * as commander from 'commander';
import * as util from './util';
import * as program from './program';
import { ProgramError } from '../errors';
import { Options, defaultOptions } from '../options';

const pkgFile = find.sync('package.json', {cwd: __dirname});
const pkg = require(pkgFile);
const options: Options = Object.assign({}, defaultOptions);
let compilerOptions: string = '{}';

function defaultAction() {
  const files: string[] = commander.args
    .filter(arg => typeof arg === 'string');

  if (files.length === 0) {
    throw new ProgramError('No entry file(s) passed to transform.');
  }

  const opts = ts.convertCompilerOptionsFromJson(JSON.parse(compilerOptions), '.');

  options.log = false;
  options.compilerOptions = opts.options;

  if (opts.errors.length > 0) {
    program.status.diagnostics(util.formatDiagnostics(opts.errors));
    program.status.error();
    return;
  }

  program.start(files, options, pkg.version);
}

function setNoAnnotate() {
  options.annotate = false;
}

function setCompilerOptions(opts: string) {
  compilerOptions = opts;
}

function setDeclarationFileName(fileName: string) {
  const ext = path.extname(fileName);

  if (ext) {
    fileName = fileName.slice(0, ext.length * -1);
  }

  if (path.basename(fileName) !== fileName) {
    throw new ProgramError('Declaration file name must not be a path.');
  }

  options.declarationFileName = fileName;
}

function setExcludeDeclarationFile() {
  options.importDeclarations = false;
}

function setForce() {
  options.force = true;
}

function setKeepTemp() {
  options.keepTemp = true;
}

function setLibIdentifier(identifier: string) {
  options.libIdentifier = identifier;
}

function setLibNamespace(namespace: string) {
  options.libNamespace = namespace;
}

function setDeclarationPrefix(prefix: string) {
  options.declarationPrefix = prefix;
}

function setStackTraceOutput(limit: number) {
  options.stackTraceOutput = limit;
}

function setTempFolder(name: string) {
  options.tempFolderName = name;
}

function setModuleAlias() {
  options.moduleAlias = true;
}

commander
  .version(pkg.version, '-v, --version')
  .description(`---------  ts-runtime  ---------
  Turns TypeScript type assertions
  into runtime type checks for you
  --------------------------------`)
  .usage('<file...> [options]')
  .option('-a, --noAnnotate', 'do not annotate classes and functions', setNoAnnotate)
  .option('-c, --compilerOptions <compilerOptions>', 'set TypeScript compiler options. defaults to "{}"', setCompilerOptions)
  .option('-d, --declarationFileName <fileName>', 'set file name for global declarations. defaults to "tsr-declarations"', setDeclarationFileName)
  .option('-e, --excludeDeclarationFile', 'do not automatically import ambient declarations in the entry file. default to false', setExcludeDeclarationFile)
  .option('-f, --force', 'try to finish on TypeScript compiler error. defaults to false', setForce)
  .option('-k, --keepTemp', 'keep temporary files. defaults to false', setKeepTemp)
  .option('-l, --libIdentifier <name>', 'lib import name. defaults to "t"', setLibIdentifier)
  .option('-m, --moduleAlias', 'import package module-alias on top of every file.', setModuleAlias)
  .option('-n, --libNamespace <namespace>', 'prefix for lib and code additions. defaults to "_"', setLibNamespace)
  .option('-p, --declarationPrefix <namespace>', 'prefix for added variables. defaults to "_"', setDeclarationPrefix)
  .option('-s, --stackTraceOutput <limit>', 'output a specified number of lines of the stack trace. defaults to 3', setStackTraceOutput)
  .option('-t, --tempFolder <name>', 'set folder name for temporary files. defaults to ".tsr"', setTempFolder)
  .on('--help', () => {
    console.log('  Examples:');
    console.log();
    console.log('    $ tsr entry.ts --force');
    console.log('    $ tsr src/bin/index.ts src/lib/index.ts');
    console.log('    $ tsr -c \'{ "outDir": "dist" }\' entry.ts');
    console.log();
  });

commander.parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
  process.exit();
} else {
  defaultAction();
}
