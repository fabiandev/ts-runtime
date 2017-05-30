import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class FunctionExpressionMutator extends Mutator {

  protected kind = ts.SyntaxKind.FunctionExpression;

  protected mutate(node: ts.FunctionExpression): ts.Expression {
    let substitution: ts.Expression = this.factory.mutateFunctionBody(node) as ts.FunctionExpression;

    substitution = ts.updateFunctionExpression(
      node, node.modifiers, node.asteriskToken, node.name, node.typeParameters,
      node.parameters, node.type, (substitution as ts.FunctionExpression).body
    );

    let annotation = this.factory.libCall('annotate', [
      substitution, this.factory.functionTypeReflection(node)
    ]);

    return annotation;
  }

}
