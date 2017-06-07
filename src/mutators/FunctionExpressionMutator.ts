import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class FunctionExpressionMutator extends Mutator {

  protected kind = ts.SyntaxKind.FunctionExpression;

  protected mutate(node: ts.FunctionExpression): ts.Expression {
    const substitution = this.factory.mutateFunctionBody(node) as ts.FunctionExpression;

    return this.factory.annotate([
      substitution,
      this.factory.functionReflection(node)
    ]);
  }

}
