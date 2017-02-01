"use strict";
const Config_1 = require("./Config");
const default_config_1 = require("../compiler/default_config");
exports.DEFAULT_CONFIG = Object.assign({}, {
    languageVersion: Config_1.ScriptTarget.ES6,
    scriptKind: Config_1.ScriptKind.TS,
    setParentNodes: true,
}, default_config_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.DEFAULT_CONFIG;
