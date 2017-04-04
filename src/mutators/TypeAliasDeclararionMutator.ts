import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class TypeAliasDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.TypeAliasDeclaration;

  public mutate(node: ts.TypeAliasDeclaration): ts.Node {
    let typeReflection = this.factory.typeReflection(node.type);

    if (this.context.hasSelfReference(node)) {
      typeReflection = this.factory.selfReference(node.name, typeReflection);
    }

    const substitution = ts.createVariableStatement(
      node.modifiers,
      ts.createVariableDeclarationList(
        [
          ts.createVariableDeclaration(
            node.name,
            undefined,
            this.factory.typeAliasSubstitution(node.name, typeReflection)
          )
        ],
        ts.NodeFlags.Const
      )
    );

    this.context.addVisited(substitution, true);

    return substitution;
  }

}
