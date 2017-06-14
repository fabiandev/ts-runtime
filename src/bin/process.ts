import * as ts from 'typescript';
import * as bus from '../bus';
import * as util from './util';
import { Options } from '../options';
import { transform } from '../transform';

let options: Options;
let started = false;

function handleError(error: string | Error) {
  process.send({ message: 'error', payload: util.getError(error, options) });
}

process.on('message', (data: { message: string, payload: any[] }) => {
  options = data.payload[1];

  if (data.message === 'startTransformation' && !started) {
    started = true;
    transform(data.payload[0], data.payload[1]);
  }
});

process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

bus.on(bus.events.ERROR, handleError);

bus.on(bus.events.WARN, (args: any[]) => {
  process.send({ message: 'warn', payload: args });
});

bus.on(bus.events.START, (args: any[]) => {
  process.send({ message: 'start', payload: args });
});

bus.on(bus.events.SCAN, (args: any[]) => {
  process.send({ message: 'scan', payload: args });
});

bus.on(bus.events.TRANSFORM, (args: any[]) => {
  const sourceFiles = args[0] as ts.SourceFile[];
  const time = args[1];
  const fileNames = sourceFiles.map(sf => sf.fileName);

  process.send({ message: 'transform', payload: [fileNames, time] });
});

bus.on(bus.events.DIAGNOSTICS, (args: any[]) => {
  const diagnostics = args[0] as ts.Diagnostic[];
  let formatted = util.formatDiagnostics(diagnostics);

  let i, j, temp, chunk = 10;
  for (i = 0, j = formatted.length; i < j; i += chunk) {
    temp = formatted.slice(i, i + chunk);
    process.send({ message: 'diagnostics', payload: [temp] });
  }
});

bus.on(bus.events.CLEANUP, (args: any[]) => {
  process.send({ message: 'cleanup', payload: args });
});

bus.on(bus.events.STOP, (args: any[]) => {
  process.send({ message: 'stop', payload: args });
});

bus.on(bus.events.END, (args: any[]) => {
  process.send({ message: 'end', payload: args });
});
