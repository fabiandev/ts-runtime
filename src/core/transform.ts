import * as ts from 'typescript';
import { Preprocessor, Transformer, ProcessorResult } from './processors';
import { DEFAULT_OPTIONS, TsRuntimeOptions } from './options';

export function transform(files: string | string[], options: TsRuntimeOptions = {}): void {
  options = getOptions(options);
  files = getFiles(files);

  (new Preprocessor({files, options})).process()
  .then((result: ProcessorResult) => {
    return (new Transformer(result)).process();
  }).then((result: ProcessorResult) => {
    return finish(result);
  });
}

function getOptions(options: TsRuntimeOptions = {}): TsRuntimeOptions {
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

function finish(result: ProcessorResult): void {
  console.log('finished');
}
