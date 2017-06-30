import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class InterfaceDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.InterfaceDeclaration;

  protected mutate(node: ts.InterfaceDeclaration): ts.Node {
    if (this.removeInterface(node)) {
      return null;
    }

    return this.factory.interfaceSubstitution(node);
  }

  private removeInterface(node: ts.InterfaceDeclaration): boolean {
    const nodeSymbol = this.scanner.getNodeSymbol(node.name);
    const willBeDeclaredInClass = this.willBeDeclaredInClass(nodeSymbol.getDeclarations());
    const wasMerged = this.context.wasMerged(nodeSymbol);

    if (!willBeDeclaredInClass) {
      this.context.setMerged(nodeSymbol);
    }

    return willBeDeclaredInClass || wasMerged;
  }

  private willBeDeclaredInClass(declarations: ts.Declaration[]) {
    for(let declaration of declarations) {
      if (ts.isClassDeclaration(declaration)) {
        return true;
      }
    }

    return false;
  }

}
