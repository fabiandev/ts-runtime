'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const tspoon = require('tspoon');

const ImplementsReplacer = require('../replacers/ImplementsReplacer');
const defaultOptions = require('./options');

function transform(files, options) {
  const results = [];

  if (typeof files === 'string') {
    files = [files];
  }

  if (!Array.isArray(files)) {
    console.error('Files passed to transform must be array or string.');
    return;
  }

  options = !options ? defaultOptions : Object.assign({}, defaultOptions, options);

  for (let file of files) {
    console.log('Read: ', file);

    let result = doTransform(file, options);

    results.push(result);

    if (options.write) {
      write(result, options);
    }
  }
}

function doTransform(file, options) {
  let source = ImplementsReplacer(fs.readFileSync(file, options.encoding));
  let result = tspoon.transpile(source, {
    sourceFileName: path.basename(file),
    compilerOptions: options.compilerOptions,
    visitors: require('../visitors')
  });

  return {
    originalPath: file,
    transpiler: result
  };
}

function report(result) {
  if (result.diags) {
    result.diags.forEach(d => {
      let position = d.file.getLineAndCharacterOfPosition(d.start);
      return console.error(
        `-> ${d.file.fileName}:${1 + position.line}:${position.character}:${d.messageText}`
      );
    });
  }

  if (result.halted) {
    process.exit(1);
  }
}

function write(result, options) {
  let file = result.originalPath.replace(new RegExp(`^${options.base}`), '');
  let location = path.join(options.write, file);

  location = path.join(
    path.dirname(location),
    `${path.basename(location, '.ts')}.js`
  );

  fs.writeFile(location, result.transpiler.code, {
    encoding: options.encoding
  });

  console.log('Write:', location);
}

module.exports = transform;
