import * as ts from 'typescript';
import { FileReflection } from '../../src/host';
import { transformReflection } from '../../src/transform';

function sendMessage(message: any) {
  self.postMessage(JSON.parse(JSON.stringify(message)), void 0);
}

function transform(entryFiles: string[], reflections: FileReflection[], options: ts.CompilerOptions) {
  const compilerOptions = {
    rootDir: 'src',
    noLib: false,
    lib: ['lib.d.ts'],
    target: ts.ScriptTarget.ES2015,
    emitDecoratorMetadata: false
  };

  for (let option in options) {
    compilerOptions[option] = options[option];
  }

  let transformed: FileReflection[];
  let error: any;

  try {
    transformed = transformReflection(
      entryFiles,
      reflections,
      {
        force: true,
        compilerOptions
      }
    );
  } catch (e) {
    transformed = undefined;
    error = e;
  }

  sendMessage({
    name: 'transformed',
    data: transformed,
    error: error
  });

  if (error) {
    throw error;
  }
}

self.addEventListener('message', message => {
  if (message.data.name === 'transform') {
    transform(message.data.entryFiles, message.data.reflections, message.data.options);
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
