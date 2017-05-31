import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class TypeAliasDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.TypeAliasDeclaration;

  protected mutate(node: ts.TypeAliasDeclaration): ts.Node {
    return this.factory.typeAliasDeclaration(node);
  }

}
