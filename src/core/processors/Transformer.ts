import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as tspoon from 'tspoon';
import { TranspilerOutput, Visitor } from 'tspoon';
import { Processor } from './Processor';
import { ProcessorResult } from './ProcessorResult';
import { FileResult } from './FileResult';
import * as visitors from '../../visitors';

export class Transformer extends Processor {

  public process(): Promise<ProcessorResult> {
    return new Promise((resolve, reject) => {
      const results: FileResult[] = [];

      for (const file of this.result.files) {
        results.push(this.transformFile(file));
      }

      for (const result of results) {
        this.reportFile(result.transpiler);
      }

      resolve(Object.assign({}, this.result, { result: results }));
    });
  }

  private transformFile(file: string): FileResult {
    const source = fs.readFileSync(file, this.result.options.encoding);

    const v: Visitor[] = Object.keys(visitors).map((key: string) => {
      return (visitors as any)[key];
    });

    const transpiler = tspoon.transpile(source, {
      compilerOptions: this.result.options.compilerOptions,
      sourceFileName: path.basename(file),
      visitors: v,
    });

    return {
      transpiler,
      file,
    };
  }

  private reportFile(transpiler: TranspilerOutput) {
    if (transpiler.diags) {
      transpiler.diags.forEach((d: any) => {
        const position = d.file.getLineAndCharacterOfPosition(d.start);

        const name = d.file.fileName;
        const line = position.line + 1;
        const character = position.character;
        const text = d.messageText;

        return console.error(`-> ${name}:${line}:${character}:${text}`);
      });
    }

    if (transpiler.halted) {
      process.exit(1);
    }
  }

}
