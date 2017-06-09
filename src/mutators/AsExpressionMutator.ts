import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class AsExpressionMutator extends Mutator {

  protected kind = ts.SyntaxKind.AsExpression;

  protected mutate(node: ts.AsExpression): ts.Node {
    if (node.type.kind === ts.SyntaxKind.AnyKeyword) {
      return node;
    }

    if (this.context.isSafeAssignment(node.type, node.expression)) {
      return node;
    }

    return this.factory.typeReflectionAndAssertion(node.type, node.expression);
  }

}
