"use strict";
const path = require("path");
// import * as fs from 'fs';
const ts = require("typescript");
const default_config_1 = require("./default_config");
const bus_1 = require("../bus");
class Writer {
    constructor(transformerResult) {
        this.transformerResult = transformerResult;
    }
    writeAll(config) {
        const toWrite = [];
        for (const fileResult of this.transformerResult.fileResults) {
            toWrite.push(this.writeFile(fileResult, config));
        }
        return Promise.all(toWrite);
    }
    writeFile(fileResult, config) {
        return new Promise((resolve, reject) => {
            config = config ? Object.assign({}, default_config_1.default, config) : default_config_1.default;
            const file = fileResult.filePath.replace(new RegExp(`^${config.basePath}`), '');
            let location = path.join(config.writePath, file);
            location = path.join(path.dirname(path.join(config.writePath, file)), `${path.basename(location, '.ts')}.js`);
            ts.sys.writeFile(location, fileResult.result);
            bus_1.bus.emit('write.file.done', fileResult.filePath);
            resolve({
                fileResult,
                originalPath: fileResult.fileName,
                writePath: location,
            });
            bus_1.bus.emit('write.file.start', fileResult.filePath);
        });
    }
}
exports.Writer = Writer;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Writer;
