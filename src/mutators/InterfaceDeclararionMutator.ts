import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class InterfaceDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.InterfaceDeclaration;

  public mutate(node: ts.InterfaceDeclaration): ts.Node {
    const substitution = ts.createVariableStatement(
      node.modifiers,
      ts.createVariableDeclarationList(
        [
          ts.createVariableDeclaration(
            node.name,
            undefined,
            this.context.generator.propertyAccessCall(this.context.generator.lib, 'type', [
              ts.createLiteral(node.name),
              this.context.generator.typeElements(node.members)
            ])
          )
        ],
        ts.NodeFlags.Const
      )
    );

    this.context.addVisited(substitution, true);

    return substitution;
  }

}
