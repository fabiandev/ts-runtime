import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript/built/local/typescript';
import { Config } from '../config';
import { Transformer, DEFAULT_TRANSFORMERS } from './transformers';
import CompilerResult from './CompilerResult';
import FileResult from './FileResult';

export class Compiler {

  protected transformers: Transformer[] = [];

  constructor(protected config: Config, transformers?: Transformer[]) {
    const transformersToEnable = transformers || DEFAULT_TRANSFORMERS;

    Transformer.DEFAULT_CONFIG = config;

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
    let parent = node.parent;

    for (const transformer of this.transformers) {
      substitutedNode = transformer.process(substitutedNode, context);
    }

    return substitutedNode;
  }

  private transformFile(filePath: string, transformers: ts.Transformer[]): Promise<FileResult> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, this.config.encoding, (err, source) => {
        if (err) {
          return reject(`Error reading file ${filePath}`);
        }

        const fileName = path.basename(filePath);

        let sourceFile = ts.createSourceFile(
          fileName,
          source,
          this.config.compilerOptions.target || ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TS,
        );

        if (this.config.mode === 'visit') {
          transformers = [];
          sourceFile = this.visit(sourceFile) as ts.SourceFile;
        }

        const result = ts.emit(sourceFile, transformers).result;

        resolve({
          fileName,
          filePath,
          result,
        });
      });
    });
  }

  private visit(node: ts.Node): ts.Node {
    return this.config.visitChildrenFirst ?
      this.visitChildrenFirst(node) :
      this.visitParentFirst(node);
  }

  private visitChildrenFirst(node: ts.Node): ts.Node {
    node = ts.visitEachChild(node, this.visitChildrenFirst.bind(this));
    return this.onSubstituteNode(undefined, node);
  }

  private visitParentFirst(node: ts.Node): ts.Node {
    node = this.onSubstituteNode(undefined, node);
    return ts.visitEachChild(node, this.visitParentFirst.bind(this));
  }

}

export default Compiler;
