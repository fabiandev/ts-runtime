import * as ts from 'typescript';
import { MutationContext } from '../context';
const self = Mutator;

export abstract class Mutator {

  protected abstract kind: ts.SyntaxKind | ts.SyntaxKind[];

  protected abstract mutate(node: ts.Node, context?: MutationContext): ts.Node;

  protected context: MutationContext;

  public mutateNode(node: ts.Node, context: MutationContext): ts.Node {
    this.context = context;

    if (this.getKind().indexOf(node.kind) === -1) {
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

}
