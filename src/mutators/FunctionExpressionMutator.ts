import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class FunctionExpressionMutator extends Mutator {

  protected kind = ts.SyntaxKind.FunctionExpression;

  // TODO: implement
  protected mutate(node: ts.FunctionExpression): ts.FunctionExpression {
    return node;
  }

}
