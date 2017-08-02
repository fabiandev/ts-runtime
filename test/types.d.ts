import expectLib = require('expect.js');
import assertLib = require('assert');
import tsrLib = require('../src/index');
import utilLib = require('./util');

declare global {
  const assert: typeof assertLib;
  const tsr: typeof tsrLib;
  const util: typeof utilLib;

  namespace NodeJS {
    interface Global {
      expect: typeof expect;
      assert: typeof assert;
      tsr: typeof tsr;
      util: typeof util;
    }
  }
}
