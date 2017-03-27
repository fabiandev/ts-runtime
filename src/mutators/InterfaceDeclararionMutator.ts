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
            ts.createCall(
              ts.createIdentifier('Symbol'),
              undefined,
              [
                ts.createLiteral(node.name)
              ]
            )
          )
        ],
        ts.NodeFlags.Const
      )
    );

    this.context.addVisited(substitution, true);

    return substitution;
  }

}
