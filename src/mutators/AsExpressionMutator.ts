import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class AsExpressionMutator extends Mutator {

  protected kind = ts.SyntaxKind.AsExpression;

  protected mutate(node: ts.AsExpression): ts.Node {
    return this.context.addVisited(
      this.factory.typeReflectionAndAssertion(
        (node as ts.AsExpression).type,
        (node as ts.AsExpression).expression
      ), true, (node as ts.AsExpression).expression);
  }

}
