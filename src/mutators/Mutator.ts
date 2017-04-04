import * as ts from 'typescript';
import { Generator } from '../generator';
import { Factory } from '../factory';
import { MutationContext } from '../context';

export abstract class Mutator {

  protected abstract kind: ts.SyntaxKind | ts.SyntaxKind[];

  protected abstract mutate(node: ts.Node, context?: MutationContext): ts.Node;

  protected context: MutationContext;

  public mutateNode(node: ts.Node, context: MutationContext): ts.Node {
    this.context = context;

    if (!node || this.getKind().indexOf(node.kind) === -1) {
      return node;
    }

    if (context.wasVisited(node)) {
      return node;
    }

    const substitution = this.mutate(node, context);
    context.addVisited(substitution);

    return substitution;
  }

  public getKind(): ts.SyntaxKind[] {
    if (Array.isArray(this.kind)) {
      return this.kind;
    }

    return [this.kind];
  }

  get generator(): Generator {
    return this.context.generator;
  }

  get factory(): Factory {
    return this.context.factory;
  }

}
