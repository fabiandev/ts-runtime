import * as ts from 'typescript';
import { Compiler, CompilerResult } from './compiler';
import { Options, DEFAULT_OPTIONS } from './options';

export function transform(files: string | string[], options: Options = {}): Promise<CompilerResult> {
  console.log('--> Starting');

  options = getOptions(options);
  files = getFiles(files);

  return new Compiler({ files, options })
    .process()
    .then(transformerResult => {
      finish(transformerResult);
      return transformerResult;
    });
}

function getOptions(options: Options = {}): Options {
  return Object.assign({}, DEFAULT_OPTIONS, options);
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
