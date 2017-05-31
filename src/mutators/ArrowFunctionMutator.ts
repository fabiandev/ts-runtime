import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class ArrowFunctionMutator extends Mutator {

  protected kind = ts.SyntaxKind.ArrowFunction;

  protected mutate(node: ts.ArrowFunction): ts.Expression {
    const substitution = this.factory.mutateFunctionBody(node) as ts.ArrowFunction;

    return this.factory.annotate([
      substitution,
      this.factory.functionTypeReflection(node)
    ]);;
  }

}
