import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript/built/local/typescript';
import { TsRuntimeOptions } from '../options';
import { CompilerResult } from './CompilerResult';
import { CompilerConfig } from './CompilerConfig';
import { FileResult } from './FileResult';
import { Transformer } from './transformers';
import { Visitor } from './visitors/Visitor';
import * as TRANSFORMERS from './transformers/default_transformers';
import * as VISITORS from './visitors/default_visitors';

export class Compiler {

  constructor(protected config: CompilerConfig) {

  }

  public process(): Promise<CompilerResult> {
    const toTransform: Array<Promise<FileResult>> = [];

    const transformers: ts.Transformer[] = Object.keys(TRANSFORMERS).map((key: string) => {
      const transformer = new (TRANSFORMERS as any)[key]();

      const transform: ts.Transformer = (context) => (f) => {
        for (const substitution of transformer.getSubstitutions()) {
          context.enableSubstitution(substitution);
        }
        context.onSubstituteNode = transformer.process.bind(transformer);
        return f;
      };
      return transform;
    });

    for (const file of this.config.files) {
      toTransform.push(this.transformFile(file, transformers));
    }

    return Promise.all(toTransform)
      .then(results => {
        return {
          config: this.config,
          fileResults: results,
        };
      })
      .catch(err => {
        console.error(err);
      });
  }

  // public processVisitors(): Promise<CompilerResult> {
  //   const toVisit: Array<Promise<FileResult>> = [];
  //
  //   const visitors: Visitor[] = Object.keys(VISITORS).map((key: string) => {
  //     return new (VISITORS as any)[key]();
  //   });
  //
  //   for (const file of this.config.files) {
  //     toVisit.push(this.visitFile(file, visitors));
  //   }
  //
  //   return Promise.all(toVisit)
  //     .then(results => {
  //       return {
  //         config: this.config,
  //         fileResults: results,
  //       };
  //     })
  //     .catch(err => {
  //       console.error(err);
  //     });
  // }
  //
  // private visitFile(filePath: string, visitors: Visitor[]): Promise<FileResult> {
  //
  // }

  private transformFile(filePath: string, transformers: ts.Transformer[]): Promise<FileResult> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, this.config.options.encoding, (err, source) => {
        if (err) {
          return reject(`Error reading file ${filePath}`);
        }

        const fileName = path.basename(filePath);

        const f = ts.createSourceFile(
          fileName,
          source,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TS,
        );

        const result = ts.emit(f, transformers).result;

        resolve({
          fileName,
          filePath,
          result,
        });
      });
    });
  }

}
