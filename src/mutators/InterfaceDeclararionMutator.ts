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
    const typeInfo = this.scanner.getTypeInfo(node);
    const willBeDeclaredInClass = this.willBeDeclaredInClass(typeInfo.declarations);
    const wasMerged = this.context.wasMerged(typeInfo.symbol);

    if (!willBeDeclaredInClass) {
      this.context.setMerged(typeInfo.symbol);
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
