import * as fs from 'fs';
import * as path from 'path';
import { TranspilerOutput, Visitor, transpile } from 'tspoon';
import { TsRuntimeOptions } from '../options';
import { TransformerResult } from './TransformerResult';
import { TransformerConfig } from './TransformerConfig';
import { FileResult } from './FileResult';
import * as DEFAULT_VISITORS from '../visitors/default_visitors';

export class Transformer {

  constructor(protected config: TransformerConfig) {

  }

  public process(): Promise<TransformerResult> {
    const toTransform: Array<Promise<FileResult>> = [];

    for (const file of this.config.files) {
      toTransform.push(this.transformFile(file));
    }

    return Promise.all(toTransform)
      .then(results => {
        return {
          config: this.config,
          fileResults: results,
        };
      });
  }

  private transformFile(file: string): Promise<FileResult> {
    return new Promise((resolve, reject) => {
      fs.readFile(file, this.config.options.encoding, (err, source) => {
        if (err) {
          return reject(`Error reading file ${file}`);
        }

        const visitors = Object.keys(DEFAULT_VISITORS).map((key: string) => {
          return new (DEFAULT_VISITORS as any)[key]();
        });

        const transpiler = transpile(source, {
          compilerOptions: this.config.options.compilerOptions,
          sourceFileName: path.basename(file),
          visitors,
        });

        this.reportFile(transpiler);

        resolve({
          transpiler,
          file,
        });
      });
    });
  }

  private reportFile(transpiler: TranspilerOutput): boolean {
    if (transpiler.diags) {
      for (const d of transpiler.diags) {
        const position = d.file.getLineAndCharacterOfPosition(d.start);

        const name = d.file.fileName;
        const line = position.line + 1;
        const character = position.character;
        const text = d.messageText;

        console.error(`-> ${name}:${line}:${character}:${text}`);
      }
    }

    if (transpiler.halted) {
      console.error('Transpiler halted. Exiting now.');
      process.exit(1);
    }

    return !!transpiler.diags;
  }

}
