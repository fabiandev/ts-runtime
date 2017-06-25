import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class ArrowFunctionMutator extends Mutator {

  protected kind = ts.SyntaxKind.ArrowFunction;

  protected mutate(node: ts.ArrowFunction): ts.Expression {
    let substitution: ts.Expression = this.factory.mutateFunctionBody(node) as ts.ArrowFunction;

    if (!this.options.noAnnotate) {
      substitution = this.factory.annotate([
        substitution,
        this.factory.functionReflection(node)
      ]);
    }

    return substitution;
  }

}
