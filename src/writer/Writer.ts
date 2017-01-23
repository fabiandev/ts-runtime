import * as path from 'path';
import * as fs from 'fs';
import { TransformerResult, FileResult } from '../transformer';
import { WriteResult } from './WriteResult';

export class Writer {

  constructor(private transformerResult: TransformerResult) {

  }

  public writeAll(): Promise<WriteResult[]> {
    const toWrite: Array<Promise<WriteResult>> = [];

    for (const fileResult of this.transformerResult.fileResults) {
      toWrite.push(this.writeFile(fileResult));
    }

    return Promise.all(toWrite);
  }

  public writeFile(fileResult: FileResult): Promise<WriteResult> {
    return new Promise((resolve, reject) => {
      const options = this.transformerResult.config.options;

      const file = fileResult.file.replace(
        new RegExp(`^${options.base}`),
        '',
      );

      let location = path.join(options.write as string, file);

      location = path.join(
        path.dirname(path.join(options.write as string, file)),
        `${path.basename(location, '.ts')}.js`,
      );

      fs.writeFile(location, fileResult.transpiler.code, {
        encoding: options.encoding,
      }, err => {
        if (err) {
          return reject(`Error writing ${location}`);
        }

        console.log('--> Written:', location);

        resolve({
          fileResult,
          originalPath: fileResult.file,
          writePath: location,
        });
      });

      console.log('--> Writing:', location);
    });
  }

}
