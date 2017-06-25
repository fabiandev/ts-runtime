import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class FunctionExpressionMutator extends Mutator {

  protected kind = ts.SyntaxKind.FunctionExpression;

  protected mutate(node: ts.FunctionExpression): ts.Expression {
    let substitution: ts.Expression = this.factory.mutateFunctionBody(node) as ts.FunctionExpression;

    if (!this.options.noAnnotate) {
      substitution = this.factory.annotate([
        substitution,
        this.factory.functionReflection(node)
      ]);
    }

    return substitution;
  }

}
