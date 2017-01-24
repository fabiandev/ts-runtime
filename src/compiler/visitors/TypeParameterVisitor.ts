import * as ts from 'typescript';
import { Visitor, VisitorContext } from 'tspoon';

export class TypeParameterVisitor implements Visitor {

  public filter(node: ts.Node): boolean {
    return node.kind === ts.SyntaxKind.VariableDeclaration;
  }

  public visit(node: ts.VariableDeclaration, context: VisitorContext, traverse: (...visitors: Visitor[]) => void): void {
    console.log(node.getText());
  }

}
