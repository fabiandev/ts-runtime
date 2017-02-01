"use strict";
const compiler_1 = require("./compiler");
const config_1 = require("./config");
const bus_1 = require("./bus");
function transform(files, config = {}) {
    config = getConfig(config);
    config.files = getFiles(files || config.files);
    bus_1.bus.emit('main.start', config.files);
    return new compiler_1.Compiler(config)
        .process()
        .then(transformerResult => {
        bus_1.bus.emit('main.done', config.files);
        return transformerResult;
    });
}
exports.transform = transform;
function getConfig(config = {}) {
    return Object.assign({}, config_1.DEFAULT_CONFIG, config);
}
function getFiles(files) {
    if (typeof files === 'string') {
        files = [files];
    }
    if (!Array.isArray(files)) {
        bus_1.bus.emit('error', new TypeError('Files passed to transform must be of type string[] or string.'));
    }
    return files;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = transform;
