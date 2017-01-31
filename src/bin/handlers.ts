import * as cp from 'child_process';
import * as path from 'path';
import { bus } from '../bus';

const child = cp.fork(path.join(__dirname, './status'));
child.send({message: 'init'});

child.on('exit', () => {
  process.exit();
});

function handleError(error: Error | string) {
  child.send({message: 'error', payload: error});
}

process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);
bus.on('error', handleError);

bus.on('main.start', (filePaths: string[]) => {
  child.send({message: 'start', payload: filePaths.length});
});

bus.on('main.done', (filePaths: string[]) => {
  child.send({message: 'end'});
});

bus.on('transform.file.start', (filePath: string) => {
  child.send({message: 'fileStart', payload: filePath});
});

bus.on('transform.file.readError', (filePath: string) => {
  child.send({message: 'fileReadError', payload: filePath});
});

bus.on('transform.file.done', (filePath: string) => {
  child.send({message: 'fileEnd', payload: filePath});
});

// process.on('SIGINT', () => {
//   child.send({message: 'term'});
// });
//
// process.on('SIGTERM', () => {
//   process.stdin.resume();
//   child.send({message: 'term'});
// });
