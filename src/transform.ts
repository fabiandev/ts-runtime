import * as ts from 'typescript';
import { Transformer, TransformerResult } from './transformer';
import { TsRuntimeOptions, DEFAULT_OPTIONS } from './options';

export function transform(files: string | string[], options: TsRuntimeOptions = {}): Promise<any> {
  options = getOptions(options);
  files = getFiles(files);

  return new Transformer({ files, options })
    .process()
    .then(transformerResult => {
      finish(transformerResult);
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

function finish(transformerResult?: TransformerResult): void {
  console.log('--------');
  console.log('Finished.');
}
