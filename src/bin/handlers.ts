import * as cp from 'child_process';
import * as path from 'path';
import * as ts from 'typescript';
import * as bus from '../bus';
import * as util from './util';
import { Options } from '../options';

const child = cp.fork(path.join(__dirname, './status'));
let childIsRunning = true;

let options: Options;

bus.emitter.on(bus.events.INTERNAL_OPTIONS, (opts: Options) => {
  options = opts;
});

function killChild(exitOtherwise = true) {
  if (childIsRunning) {
    child.kill();
  } else if (exitOtherwise) {
    process.exit(0);
  }
}

process.on('exit', () => {
  killChild();
});

process.on('SIGINT', () => {
  killChild();
});

process.on('SIGTERM', () => {
  killChild();
});

child.on('exit', code => {
  childIsRunning = false;
  process.exit(code);
});

function handleError(error: string | Error) {
  if (childIsRunning) {
    child.send({ message: 'error', payload: util.getError(error, options) });
  } else {
    process.exit(1);
  }
}

process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

bus.emitter.on(bus.events.ERROR, handleError);

bus.emitter.on(bus.events.START, (args: any[]) => {
  child.send({ message: 'start', payload: args });
});

bus.emitter.on(bus.events.TRANSFORM, (args: any[]) => {
  const sourceFiles = args[0] as ts.SourceFile[];
  const fileNames = sourceFiles.map(sf => sf.fileName);

  child.send({ message: 'transform', payload: fileNames });
});

bus.emitter.on(bus.events.DIAGNOSTICS, (args: any[]) => {
  const diagnostics = args[0] as ts.Diagnostic[];
  let formatted: string[] = [];

  for (let diag of diagnostics) {
    formatted.push(ts.formatDiagnostics([diag], {
      getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
      getNewLine: () => ts.sys.newLine,
      getCanonicalFileName: (f: string) => f
    }).trim());
  }

  const diags = formatted.filter(str => str.trim().length > 0);

  child.send({ message: 'diagnostics', payload: diags, info: args[1] });
});

bus.emitter.on(bus.events.CLEANUP, (args: any[]) => {
  child.send({ message: 'cleanup', payload: args });
});

bus.emitter.on(bus.events.STOP, (args: any[]) => {
  child.send({ message: 'stop', payload: args });
});

bus.emitter.on(bus.events.END, (args: any[]) => {
  child.send({ message: 'end', payload: args });
});
