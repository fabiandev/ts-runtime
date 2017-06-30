import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

export class AsExpressionMutator extends Mutator {

  protected kind = ts.SyntaxKind.AsExpression;

  protected mutate(node: ts.AsExpression): ts.Node {
    if (util.isAnyKeyword(node.type)) {
      return node;
    }

    // if (this.context.isSafeAssignment(node.type, node.expression)) {
    //   return node;
    // }

    return this.factory.typeReflectionAndAssertion(node.type, node.expression);
  }

}
