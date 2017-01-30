import * as path from 'path';
import * as fs from 'fs';
import { CompilerResult, FileResult } from '../compiler';
import WriterConfig from './WriterConfig';
import WriterResult from './WriterResult';
import DEFAULT_CONFIG from './default_config';

export class Writer {

  constructor(private transformerResult: CompilerResult) {

  }

  public writeAll(config?: WriterConfig): Promise<WriterResult[]> {
    const toWrite: Array<Promise<WriterResult>> = [];

    for (const fileResult of this.transformerResult.fileResults) {
      toWrite.push(this.writeFile(fileResult, config));
    }

    return Promise.all(toWrite);
  }

  public writeFile(fileResult: FileResult, config?: WriterConfig): Promise<WriterResult> {
    return new Promise((resolve, reject) => {
      config = config ? Object.assign({}, DEFAULT_CONFIG, config) : DEFAULT_CONFIG;
      const file = fileResult.filePath.replace(new RegExp(`^${config.basePath}`), '');
      let location = path.join(config.writePath as string, file);

      location = path.join(
        path.dirname(path.join(config.writePath as string, file)),
        `${path.basename(location, '.ts')}.js`,
      );

      fs.writeFile(location, fileResult.result, {
        encoding: config.encoding,
      }, err => {
        if (err) {
          return reject(`Error writing ${location}`);
        }

        console.log('--> Written:', location);

        resolve({
          fileResult,
          originalPath: fileResult.fileName,
          writePath: location,
        });
      });

      console.log('--> Writing:', location);
    });
  }

}

export default Writer;
