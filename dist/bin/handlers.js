"use strict";
const cp = require("child_process");
const path = require("path");
const bus_1 = require("../bus");
const child = cp.fork(path.join(__dirname, './status'));
child.send({ message: 'init' });
child.on('exit', () => {
    process.exit();
});
function handleError(error) {
    child.send({ message: 'error', payload: error });
}
process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);
bus_1.bus.on('error', handleError);
bus_1.bus.on('main.start', (filePaths) => {
    child.send({ message: 'start', payload: filePaths.length });
});
bus_1.bus.on('main.done', (filePaths) => {
    child.send({ message: 'end' });
});
bus_1.bus.on('transform.file.start', (filePath) => {
    child.send({ message: 'fileStart', payload: filePath });
});
bus_1.bus.on('transform.file.readError', (filePath) => {
    child.send({ message: 'fileReadError', payload: filePath });
});
bus_1.bus.on('transform.file.done', (filePath) => {
    child.send({ message: 'fileEnd', payload: filePath });
});
bus_1.bus.on('write.start', (num) => {
    child.send({ message: 'writeStart', payload: num });
});
bus_1.bus.on('write.end', (num) => {
    child.send({ message: 'writeEnd', payload: num });
});
bus_1.bus.on('write.file.start', (filePath) => {
    child.send({ message: 'fileWriteStart', payload: filePath });
});
bus_1.bus.on('transform.file.done', (filePath) => {
    child.send({ message: 'fileWriteEnd', payload: filePath });
});
// process.on('SIGINT', () => {
//   child.send({message: 'term'});
// });
//
// process.on('SIGTERM', () => {
//   process.stdin.resume();
//   child.send({message: 'term'});
// });
