import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class InterfaceDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.InterfaceDeclaration;

  protected mutate(node: ts.InterfaceDeclaration): ts.Node {
    if (this.removeInterface(node)) {
      return null;
    }

    return this.factory.typeSubstitution(node);
  }

  private removeInterface(node: ts.InterfaceDeclaration): boolean {
    const nodeInfo = this.scanner.getInfo(node);
    const willBeDeclaredInClass = this.willBeDeclaredInClass(nodeInfo.typeInfo.declarations);
    const wasMerged = this.context.wasMerged(nodeInfo.typeInfo.symbol);

    if (!willBeDeclaredInClass) {
      this.context.setMerged(nodeInfo.typeInfo.symbol);
    }

    return willBeDeclaredInClass || wasMerged;
  }

  private willBeDeclaredInClass(declarations: ts.Declaration[]) {
    for(let declaration of declarations) {
      if (declaration.kind === ts.SyntaxKind.ClassDeclaration) {
        return true;
      }
    }

    return false;
  }

}
