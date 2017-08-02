import { Options } from '../options';
import { FileReflection } from '../host';
import { transformReflection } from '../transform';

function sendMessage(message: any) {
  postMessage(JSON.parse(JSON.stringify(message)), void 0);
}

function transform(entryFiles: string[], reflections: FileReflection[], options: Options) {
  let transformed: FileReflection[];
  let error: any;

  try {
    transformed = transformReflection(
      entryFiles,
      reflections,
      options
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

self.addEventListener('message', (message: any) => {
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
};

console.info = function info(message: any, ...optionalParams: any[]) {
  sendMessage({
    name: 'log',
    type: 'info',
    data: {
      message,
      optionalParams
    }
  });
};

console.warn = function warn(message: any, ...optionalParams: any[]) {
  sendMessage({
    name: 'log',
    type: 'warn',
    data: {
      message,
      optionalParams
    }
  });
};

console.error = function error(message: any, ...optionalParams: any[]) {
  sendMessage({
    name: 'log',
    type: 'error',
    data: {
      message,
      optionalParams
    }
  });
};
