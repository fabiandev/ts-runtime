import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class FunctionDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.FunctionDeclaration;

  protected mutate(node: ts.FunctionDeclaration): ts.FunctionDeclaration {
    const substitution = this.factory.mutateFunctionBody(node) as ts.FunctionDeclaration;

    return ts.updateFunctionDeclaration(
      node, node.decorators, node.modifiers, node.asteriskToken, node.name,
      node.typeParameters, node.parameters, node.type, substitution.body
    );
  }

}
