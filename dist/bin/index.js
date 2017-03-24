#!/usr/bin/env node
"use strict";
require("./handlers");
const program = require("commander");
const transform_1 = require("../transform");
const writer_1 = require("../writer");
const pkg = require('../../package.json');
const config = {};
const writerConfig = writer_1.DEFAULT_CONFIG;
let write = false;
function defaultAction() {
    const files = program.args.filter((value) => {
        return typeof value === 'string';
    });
    transform_1.default(files)
        .then((compilerResult) => {
        if (write) {
            const writer = new writer_1.Writer(compilerResult);
            writer.writeAll();
        }
    });
}
function setNoAssertConst() {
    config.assertConst = true;
}
function setEncoding(encoding) {
    config.encoding = encoding;
    writerConfig.encoding = encoding;
}
function setWrite(location, base) {
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
}
else {
    defaultAction();
}
