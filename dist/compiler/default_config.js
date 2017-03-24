"use strict";
const default_config_1 = require("./transformers/default_config");
const CompilerMode_1 = require("./CompilerMode");
exports.DEFAULT_CONFIG = Object.assign({}, {
    files: [],
    encoding: 'utf8',
    mode: CompilerMode_1.default.Substitute,
    visitChildrenFirst: false,
}, default_config_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.DEFAULT_CONFIG;
