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

    if (this.shouldRemove(node)) {
      return null;
    }

    return this.mutate(node);
  }

  public map<T extends ts.Node>(alias: T, original: ts.Node): T {
    this.scanner.mapNode(alias, original);
    return alias;
  }

  public shouldMutate(node: ts.Node) {
    return node && util.asArray(this.kind).indexOf(node.kind) !== -1;
  }

  public shouldRemove(node: ts.Node) {
    return util.isDeclaration(node);
  }

  get factory(): Factory {
    return this.context.factory;
  }

  get scanner(): Scanner {
    return this.context.scanner;
  }

}
