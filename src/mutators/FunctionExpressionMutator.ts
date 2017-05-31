import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class FunctionExpressionMutator extends Mutator {

  protected kind = ts.SyntaxKind.FunctionExpression;

  protected mutate(node: ts.FunctionExpression): ts.Expression {
    const mutated = this.factory.mutateFunctionBody(node) as ts.FunctionExpression;

    const substitution = ts.updateFunctionExpression(
      node, node.modifiers, node.asteriskToken, node.name, node.typeParameters,
      node.parameters, node.type, (mutated as ts.FunctionExpression).body
    );

    return this.factory.annotate([
      substitution,
      this.factory.functionTypeReflection(node)
    ]);
  }

}
