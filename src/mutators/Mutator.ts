import * as ts from 'typescript';
import * as util from '../util';
import { Factory } from '../factory';
import { Scanner } from '../scanner';
import { MutationContext } from '../context';

export abstract class Mutator {

  protected abstract kind: ts.SyntaxKind | ts.SyntaxKind[];
  protected abstract mutate(node: ts.Node): ts.Node;

  protected context: MutationContext;
  protected node: ts.Node;

  public mutateNode(node: ts.Node, context: MutationContext): ts.Node {
    this.context = context;
    this.node = node;

    if (!this.shouldMutate(node)) {
      return node;
    }

    if (this.shouldSkip(node)) {
      return node;
    }

    if (util.isAmbientDeclaration(node)) {
      return node;
    }

    return this.mutate(node);
  }


  public shouldMutate(node: ts.Node) {
    return node && util.asArray(this.kind).indexOf(node.kind) !== -1;
  }

  get factory(): Factory {
    return this.context.factory;
  }

  get scanner(): Scanner {
    return this.context.scanner;
  }

  get skip() {
    return this.context.skip.bind(this.context);
  }

  get shouldSkip() {
    return this.context.shouldSkip.bind(this.context);
  }

  get map() {
    return this.scanner.mapNode.bind(this.scanner);
  }

}
