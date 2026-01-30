import expectLib = require('expect.js');
import assertLib = require('assert');
import tsrLib = require('../../src/index');
import utilLib = require('../util');

declare global {
  var expect: typeof expectLib;
  var assert: typeof assertLib;
  var tsr: typeof tsrLib;
  var util: typeof utilLib;
}
