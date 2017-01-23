import * as fs from 'fs';
import * as path from 'path';
import { TranspilerOutput, Visitor, transpile } from 'tspoon';
import { TsRuntimeOptions } from '../options';
import { TransformerResult } from './TransformerResult';
import { TransformerConfig } from './TransformerConfig';
import { FileResult } from './FileResult';
import * as visitors from '../visitors';

export class Transformer {

  constructor(protected config: TransformerConfig) {

  }

  public process(): Promise<TransformerResult> {
    return new Promise((resolve, reject) => {
      const fileResults: FileResult[] = [];

      for (const file of this.config.files) {
        fileResults.push(this.transformFile(file));
      }

      for (const result of fileResults) {
        this.reportFile(result.transpiler);
      }

      resolve(Object.assign({}, {
        config: this.config,
        fileResults,
      }));
    });
  }

  private transformFile(file: string): FileResult {
    const source = fs.readFileSync(file, this.config.options.encoding);

    const transpiler = transpile(source, {
      compilerOptions: this.config.options.compilerOptions,
      sourceFileName: path.basename(file),
      visitors: Object.keys(visitors).map((key: string) => {
        return (visitors as any)[key];
      }),
    });

    return {
      transpiler,
      file,
    };
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
      console.error('Transpiler halted. Exiting now.')
      process.exit(1);
    }

    return !!transpiler.diags;
  }

}
