#!/usr/bin/env node

import * as path from 'path';
import * as ts from 'typescript';
import * as commander from 'commander';
import * as util from './util';
import * as program from './program';
import { transform } from '../transform';
import { ProgramError } from '../errors';
import { Options, defaultOptions } from '../options';

const pkgDir = ts.sys.fileExists(path.join(__dirname, '../package.json')) ?
  path.join(__dirname, '../package.json') : path.join(__dirname, '../../package.json');

const pkg = require(pkgDir);
const options: Options = Object.assign({}, defaultOptions);

let compilerOptions: string = '{}';
let parsedCompilerOptions: any;
let tsConfigPath: string;
let fastMode = false;

function defaultAction() {
  if (fastMode) {
    options.log = true;
  } else {
    program.start(options, pkg.version);
    options.log = false;
  }

  const files: string[] = commander.args
    .filter(arg => typeof arg === 'string');

  if (files.length === 0) {
    throw new ProgramError('No entry file(s) passed to transform.');
  }

  try {
    parsedCompilerOptions = JSON.parse(compilerOptions);
  } catch (e) {
    throw new ProgramError(`Could not parse compiler configuration.`);
  }

  if (tsConfigPath) {
    if (!ts.sys.fileExists(tsConfigPath)) {
      throw new ProgramError(`Could not load configuration from ${tsConfigPath}.`);
    }

    const resolvedTsConfigPath = path.resolve(tsConfigPath);
    const tsConfig = require(resolvedTsConfigPath);

    if (tsConfig.hasOwnProperty('compilerOptions')) {
      parsedCompilerOptions = tsConfig.compilerOptions;
    } else {
      if (options.log) {
        console.warn(`No compiler options found in ${tsConfigPath}, used defaults.`);
      } else {
        program.status.warn(`No compiler options found in ${tsConfigPath}, used defaults.`);
      }
      parsedCompilerOptions = {};
    }
  }

  const opts = ts.convertCompilerOptionsFromJson(parsedCompilerOptions, '.');

  options.compilerOptions = opts.options;

  if (opts.errors.length > 0) {
    const formattedDiagnostics = util.formatDiagnostics(opts.errors);

    if (options.log) {
      for (let diagnostic of formattedDiagnostics) {
        console.error(diagnostic);
      }

      process.exit(1);
    }

    program.status.diagnostics(util.formatDiagnostics(opts.errors));
    program.status.error();
    return;
  }

  if (fastMode) {
    transform(files, options);
  } else {
    program.transform(files);
  }
}

function useTsConfig(path: string) {
  tsConfigPath = path;
}

function setNoAnnotate() {
  options.noAnnotate = true;
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
  options.excludeDeclarationFile = true;
}

function setExcludeLib() {
  options.excludeLib = true;
}

function setForce() {
  options.force = true;
}

function setFast() {
  fastMode = true;
}

function setKeepTemp() {
  options.keepTemp = true;
}

function setLibIdentifier(identifier: string) {
  options.libIdentifier = identifier;
}

function setLibDeclarations() {
  options.libDeclarations = true;
}

function setLibNamespace(namespace: string) {
  options.libNamespace = namespace;
}

function setDeclarationPrefix(prefix: string) {
  options.declarationPrefix = prefix;
}

function setStackTraceOutput(limit: string) {
  options.stackTraceOutput = parseInt(limit);
}

function setTempFolderName(name: string) {
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
  .option('-c, --tsConfig <path>', 'use the compiler options of the given tsconfig.json', useTsConfig)
  .option('-C, --compilerOptions <compilerOptions>', 'set TypeScript compiler options. defaults to "{}"', setCompilerOptions)
  .option('-d, --declarationFileName <fileName>', 'set file name for global declarations. defaults to "tsr-declarations"', setDeclarationFileName)
  .option('-e, --excludeDeclarationFile', 'do not automatically import ambient declarations in the entry file. default to false', setExcludeDeclarationFile)
  .option('-E, --excludeLib', 'do not automatically import the runtime library. defaults to false', setExcludeLib)
  .option('-f, --force', 'try to finish on TypeScript compiler error. defaults to false', setForce)
  .option('-F, --fast', 'no fancy status for the command line, but faster processing. defaults to false', setFast)
  .option('-k, --keepTemp', 'keep temporary files. defaults to false', setKeepTemp)
  .option('-l, --libIdentifier <name>', 'lib import name. defaults to "t"', setLibIdentifier)
  .option('-L, --libDeclarations', 'reflect declarations from global libs (e.g. DOM). defaults to false', setLibDeclarations)
  .option('-m, --moduleAlias', 'import package module-alias on top of every file.', setModuleAlias)
  .option('-n, --libNamespace <namespace>', 'prefix for lib and code additions. defaults to ""', setLibNamespace)
  .option('-p, --declarationPrefix <namespace>', 'prefix for added variables. defaults to "_"', setDeclarationPrefix)
  .option('-s, --stackTraceOutput <limit>', 'output a specified number of lines of the stack trace. defaults to 3', setStackTraceOutput)
  .option('-t, --tempFolderName <name>', 'set folder name for temporary files. defaults to ".tsr"', setTempFolderName)
  .on('--help', () => {
    console.log('  Examples:');
    console.log();
    console.log('    $ tsr entry.ts --force');
    console.log('    $ tsr src/entry1 bin/entry2 lib/entry3');
    console.log('    $ tsr -c tsconfig.json');
    console.log();
  });

commander.parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
  process.exit();
} else {
  defaultAction();
}
