import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class FunctionDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.FunctionDeclaration;

  protected mutate(node: ts.FunctionDeclaration): ts.FunctionDeclaration {
    return this.factory.mutateFunctionBody(node) as ts.FunctionDeclaration;
  }

}
