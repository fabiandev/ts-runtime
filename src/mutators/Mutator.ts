import * as ts from 'typescript';
import { Factory } from '../factory';
import { Scanner } from '../scanner';
import { MutationContext } from '../context';

export abstract class Mutator {

  protected abstract kind: ts.SyntaxKind | ts.SyntaxKind[];

  protected abstract mutate(node: ts.Node, context?: MutationContext): ts.Node;

  protected context: MutationContext;

  protected node: ts.Node;

  public mutateNode(node: ts.Node, context: MutationContext): ts.Node {
    this.context = context;
    this.node = node;

    if (!node) {
      return node;
    }

    if (this.getKind().indexOf(node.kind) === -1) {
      return node;
    }

    if (context.wasVisited(node)) {
      return node;
    }

    const nodeInfo = context.scanner.getInfo(node);

    if (nodeInfo && nodeInfo.typeInfo.TSR_DECLARATION) {
      return node;
    }

    const substitution = this.mutate(node, context);
    // context.addVisited(substitution);

    return substitution;
  }

  public getKind(): ts.SyntaxKind[] {
    if (Array.isArray(this.kind)) {
      return this.kind;
    }

    return [this.kind];
  }

  get factory(): Factory {
    return this.context.factory;
  }

  get scanner(): Scanner {
    return this.context.scanner;
  }

}
