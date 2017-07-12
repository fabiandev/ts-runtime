/// <reference path="../../node_modules/@types/node/index.d.ts" />

const libs: { [index: string]: string } = {};

libs['node_modules/typescript/lib/lib.es2015.d.ts'] = require('typescript/lib/lib.es2015.d.ts');
libs['node_modules/typescript/lib/lib.es2015.core.d.ts'] = require('typescript/lib/lib.es2015.core.d.ts');
libs['node_modules/typescript/lib/lib.es2015.collection.d.ts'] = require('typescript/lib/lib.es2015.collection.d.ts');
libs['node_modules/typescript/lib/lib.es2015.generator.d.ts'] = require('typescript/lib/lib.es2015.generator.d.ts');
libs['node_modules/typescript/lib/lib.es2015.iterable.d.ts'] = require('typescript/lib/lib.es2015.iterable.d.ts');
libs['node_modules/typescript/lib/lib.es2015.promise.d.ts'] = require('typescript/lib/lib.es2015.promise.d.ts');
libs['node_modules/typescript/lib/lib.es2015.proxy.d.ts'] = require('typescript/lib/lib.es2015.proxy.d.ts');
libs['node_modules/typescript/lib/lib.es2015.reflect.d.ts'] = require('typescript/lib/lib.es2015.reflect.d.ts');
libs['node_modules/typescript/lib/lib.es2015.symbol.d.ts'] = require('typescript/lib/lib.es2015.symbol.d.ts');
libs['node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts'] = require('typescript/lib/lib.es2015.symbol.wellknown.d.ts');
libs['node_modules/typescript/lib/lib.es5.d.ts'] = require('typescript/lib/lib.es5.d.ts');

export default libs;
