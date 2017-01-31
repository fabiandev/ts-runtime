import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { Config } from '../config';
import { Transformer, DEFAULT_TRANSFORMERS } from './transformers';
import { bus } from '../bus';
import CompilerMode from './CompilerMode';
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
    bus.emit('compiler.start', this.config);

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

    // Do not reject this promise, if individual files fail
    return Promise.all(toTransform.map(p => p.catch(e => e)))
      .then(results => {
        bus.emit('compiler.done', this.config);

        return {
          config: this.config,
          fileResults: results,
        };
      })
      .catch(e => {});

    // return Promise.all(toTransform)
    //   .then(results => {
    //     bus.emit('compiler.done', this.config);
    //
    //     return {
    //       config: this.config,
    //       fileResults: results,
    //     };
    //   });
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
    bus.emit('transform.file.start', filePath);

    return new Promise((resolve, reject) => {

      const fileName = path.basename(filePath);

      const source = ts.sys.readFile(filePath, this.config.encoding);

      if (source === undefined) {
        bus.emit('transform.file.readError', filePath);
        return reject(`Error reading ${filePath}`);
      }

      let sourceFile = ts.createSourceFile(
        fileName,
        source,
        this.config.languageVersion || ts.ScriptTarget.Latest,
        this.config.setParentNodes || true,
        this.config.scriptKind || ts.ScriptKind.TS,
      );

      if (this.config.mode === CompilerMode.Visit) {
        transformers = [];
        sourceFile = this.visit(sourceFile) as ts.SourceFile;
      }

      const result = ts.emit(sourceFile, transformers).result;

      bus.emit('transform.file.done', filePath);

      resolve({
        fileName,
        filePath,
        result,
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
