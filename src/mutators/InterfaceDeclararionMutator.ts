import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class InterfaceDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.InterfaceDeclaration;

  public mutate(node: ts.InterfaceDeclaration): ts.Node {
    const typeText = this.context.getImplicitTypeText(node.name);
    console.log(typeText);
    const substitution = ts.createVariableStatement(
      node.modifiers,
      ts.createVariableDeclarationList(
        [
          ts.createVariableDeclaration(
            node.name,
            undefined,
            this.factory.interfaceSubstitution(node)
          )
        ],
        ts.NodeFlags.Const
      )
    );

    this.context.addVisited(substitution, true);

    return substitution;
  }

}
