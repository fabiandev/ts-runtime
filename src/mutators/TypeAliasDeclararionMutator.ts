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
            this.factory.typeAliasSubstitution(node.name, this.factory.typeReflection(node.type))
          )
        ],
        ts.NodeFlags.Const
      )
    );

    this.context.addVisited(substitution, true);

    return substitution;
  }

}
