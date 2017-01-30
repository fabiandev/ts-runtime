import * as ts from 'typescript/built/local/typescript';
import { Compiler, CompilerResult, CompilerConfig, DEFAULT_CONFIG as DEFAULT_COMPILER_CONFIG } from './compiler';
import { Config, DEFAULT_CONFIG } from './config';

export function transform(files: string | string[], config: Config = {}): Promise<CompilerResult> {
  console.log('--> Starting');

  config = getConfig(config);
  config.files = getFiles(files);

  return new Compiler(config)
    .process()
    .then(transformerResult => {
      finish(transformerResult);
      return transformerResult;
    });
}

function getConfig(config: Config = {}): Config {
  return Object.assign({}, DEFAULT_CONFIG, DEFAULT_COMPILER_CONFIG, config);
}

function getFiles(files: string | string[]): string[] {
  if (typeof files === 'string') {
    files = [files];
  }

  if (!Array.isArray(files)) {
    throw new TypeError('Files passed to transform must be of type array or string.');
  }

  return files as string[];
}

function finish(transformerResult?: CompilerResult): void {
  console.log('--> Finished.');
}

export default transform;
