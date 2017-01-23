import * as fs from 'fs';
import * as path from 'path';
import * as tspoon from 'tspoon';
import * as ts from 'typescript';

import { TsRuntimeOptions } from './options';

import ImplementsReplacer from '../replacers/ImplementsReplacer';
import defaultOptions from './options';

function transform(files: string|string[], options: TsRuntimeOptions) {
  const results = [];

  if (typeof files === 'string') {
    files = [files];
  }

  if (!Array.isArray(files)) {
    console.error('Files passed to transform must be array or string.');
    return;
  }

  options = !options
    ? defaultOptions
    : Object.assign({}, defaultOptions, options);

  for (const file of files) {
    console.log('Read: ', file);

    const result = doTransform(file, options);

    results.push(result);

    if (options.write) {
      write(result, options);
    }
  }
}

function doTransform(file: string, options: TsRuntimeOptions) {
  const source = ImplementsReplacer(fs.readFileSync(file, options.encoding));
  const result = tspoon.transpile(source, {
    compilerOptions: options.compilerOptions,
    sourceFileName: path.basename(file),
    visitors: require('../visitors'),
  });

  return {originalPath: file, transpiler: result};
}

function report(result: any) {
  if (result.diags) {
    result.diags.forEach((d: any) => {
      const position = d.file.getLineAndCharacterOfPosition(d.start);

      const name = d.file.fileName;
      const line = position.line + 1;
      const character = position.character;
      const text = d.messageText;

      return console.error(`-> ${name}:${line}:${character}:${text}`);
    });
  }

  if (result.halted) {
    process.exit(1);
  }
}

function write(result: any, options: TsRuntimeOptions) {
  const file = result.originalPath.replace(new RegExp(`^${options.base}`), '');
  let location = path.join(options.write as string, file);

  location = path.join(path.dirname(location), `${path.basename(location, '.ts')}.js`);

  fs.writeFile(location, result.transpiler.code, {encoding: options.encoding});

  console.log('Write:', location);
}

function sourceMaps() {
  return 0;
}

export default transform;
