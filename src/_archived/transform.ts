import * as ts from 'typescript';
import { Compiler, CompilerResult, CompilerConfig } from './compiler';
import { Config, DEFAULT_CONFIG } from './config';
import { bus } from './bus';

export function transform(files?: string | string[], config: Config = {}): Promise<CompilerResult> {
  config = getConfig(config);
  config.files = getFiles(files || config.files);

  bus.emit('main.start', config.files);

  return new Compiler(config)
    .process()
    .then(transformerResult => {
      bus.emit('main.done', config.files);
      return transformerResult;
    });
}

function getConfig(config: Config = {}): Config {
  return Object.assign({}, DEFAULT_CONFIG, config);
}

function getFiles(files: string | string[]): string[] {
  if (typeof files === 'string') {
    files = [files];
  }

  if (!Array.isArray(files)) {
    bus.emit('error', new TypeError('Files passed to transform must be of type string[] or string.'));
  }

  return files as string[];
}

export default transform;
