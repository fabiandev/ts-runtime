import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class TypeAliasDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.TypeAliasDeclaration;

  public mutate(node: ts.TypeAliasDeclaration): ts.Node {
    const substitution = ts.createVariableStatement(
      node.modifiers,
      ts.createVariableDeclarationList(
        [
          ts.createVariableDeclaration(
            node.name,
            undefined,
            this.context.generator.propertyAccessCall(this.context.generator.lib, 'type', [
              ts.createLiteral(node.name),
              this.context.generator.typeDefinition(node.type)
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
