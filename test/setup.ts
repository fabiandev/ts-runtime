/// <reference path="./types/globals.d.ts" />

import expect = require('expect.js');
import * as assert from 'assert';
import * as tsr from '../src/index';
import * as util from './util';

global.expect = expect;
(global as any).assert = assert;
(global as any).tsr = tsr;
(global as any).util = util;
