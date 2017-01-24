import * as ts from 'typescript';
import { Visitor, VisitorContext } from 'tspoon';
import { VariableDeclarationTransformer } from '../transformers/VariableDeclarationTransformer';

export class VariableDeclarationVisitor implements Visitor {

  public filter(node: ts.Node): boolean {
    return node.kind === ts.SyntaxKind.VariableDeclaration;
  }

  public visit(node: ts.VariableDeclaration, context: VisitorContext, traverse: (...visitors: Visitor[]) => void): void {
    const replacer = new VariableDeclarationTransformer(node, context);
    replacer.replace();
  }

}
