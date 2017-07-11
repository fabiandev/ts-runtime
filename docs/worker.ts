import * as ts from 'typescript';
import { transformModules, FileReflection } from '../dist/transformModules';

function sendMessage(message: any) {
  self.postMessage(JSON.parse(JSON.stringify(message)), void 0);
}

function transform(modules: FileReflection[]) {
  const transformed = transformModules(modules, {
    compilerOptions: {
      // noEmit: true,
      rootDir: 'src',
      noLib: true,
      lib: undefined,
      target: ts.ScriptTarget.ES2015,
      emitDecoratorMetadata: false
    }
  });

  sendMessage({
    name: 'transformed',
    data: transformed
  });
}

self.addEventListener('message', message => {
  if (message.data.name === 'transform') {
    transform(message.data.data);
  }
});

console.log = function log(message: any, ...optionalParams: any[]) {
  sendMessage({
    name: 'log',
    type: 'log',
    data: {
      message,
      optionalParams
    }
  });
}

console.info = function info(message: any, ...optionalParams: any[]) {
  sendMessage({
    name: 'log',
    type: 'info',
    data: {
      message,
      optionalParams
    }
  });
}

console.warn = function warn(message: any, ...optionalParams: any[]) {
  sendMessage({
    name: 'log',
    type: 'warn',
    data: {
      message,
      optionalParams
    }
  });
}

console.error = function error(message: any, ...optionalParams: any[]) {
  sendMessage({
    name: 'log',
    type: 'error',
    data: {
      message,
      optionalParams
    }
  });
}
