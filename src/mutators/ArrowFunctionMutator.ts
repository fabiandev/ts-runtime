import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class ArrowFunctionMutator extends Mutator {

  protected kind = ts.SyntaxKind.ArrowFunction;

  protected mutate(node: ts.ArrowFunction): ts.Expression {
    let substitution: ts.Expression = this.factory.mutateFunctionBody(node) as ts.ArrowFunction;

    substitution = ts.updateArrowFunction(
      node, node.modifiers, node.typeParameters,
      node.parameters, node.type, (substitution as ts.ArrowFunction).body
    );

    let annotation = this.factory.libCall('annotate', [
      substitution, this.factory.functionTypeReflection(node)
    ]);

    return annotation;
  }

}
