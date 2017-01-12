'use strict';

const path = require('path');
const tsr = require('../');

tsr.transform(
  path.join(__dirname, 'src/test.ts'),
  Object.assign({}, tsr.options, {
    write: path.join(__dirname, 'dest'),
    base: path.join(__dirname, 'src')
  })
);
