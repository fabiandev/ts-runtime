import * as ts from 'typescript';
import { MutationContext } from '../context';
const self = Mutator;

export abstract class Mutator {

  protected abstract kind: ts.SyntaxKind | ts.SyntaxKind[];

  protected abstract mutate(node: ts.Node, context?: MutationContext): ts.Node;

  public mutateNode(node: ts.Node, context: MutationContext): ts.Node {
    if (!this.shouldMutate(node.kind)) {
      return node;
    }

    return this.mutate(node, context);
  }

  public getKind(): ts.SyntaxKind[] {
    if (Array.isArray(this.kind)) {
      return this.kind;
    }

    return [this.kind];
  }

  public shouldMutate(kind: ts.SyntaxKind): boolean {
    if (this.getKind().indexOf(kind) !== -1) {
      return true;
    }

    return false;
  }

}
