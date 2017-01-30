import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript/built/local/typescript';
import CompilerResult from './CompilerResult';
import CompilerConfig from './CompilerConfig';
import FileResult from './FileResult';
import { Transformer, DEFAULT_TRANSFORMERS } from './transformers';

export class Compiler {

  protected transformers: Transformer[] = [];

  constructor(protected config: CompilerConfig, transformers?: Transformer[]) {
    const transformersToEnable = transformers || DEFAULT_TRANSFORMERS;

    const enabledTtransformers = Object.keys(transformersToEnable)
      .map((key: string) => {
        return transformers ?
          (transformers as any)[key] as Transformer :
          new (transformersToEnable as any)[key]() as Transformer;
      });

    this.transformers.push(...enabledTtransformers);
  }

  public process(): Promise<CompilerResult> {
    const toTransform: Array<Promise<FileResult>> = [];

    const transform: ts.Transformer = (context) => (sourceFile) => {
      context.onSubstituteNode = this.onSubstituteNode.bind(this);

      for (const transformer of this.transformers) {
        for (const substitution of transformer.getSubstitutions()) {
          context.enableSubstitution(substitution);
        }
      }

      return sourceFile;
    };

    for (const file of this.config.files) {
      toTransform.push(this.transformFile(file, [transform]));
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

  protected onSubstituteNode(context: ts.EmitContext, node: ts.Node): ts.Node {
    let substitutedNode = node;

    for (const transformer of this.transformers) {
      substitutedNode = transformer.process(context, substitutedNode);
    }

    return substitutedNode;
  }

  private transformFile(filePath: string, transformers: ts.Transformer[]): Promise<FileResult> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, this.config.options.encoding, (err, source) => {
        if (err) {
          return reject(`Error reading file ${filePath}`);
        }

        const fileName = path.basename(filePath);

        const sourceFile = ts.createSourceFile(
          fileName,
          source,
          this.config.options.compilerOptions.target || ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TS,
        );

        const result = ts.emit(sourceFile, transformers).result;

        resolve({
          fileName,
          filePath,
          result,
        });
      });
    });
  }

}

export default Compiler;
