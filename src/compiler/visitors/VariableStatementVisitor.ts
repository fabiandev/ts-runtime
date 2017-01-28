import * as ts from 'typescript';
import { Visitor, VisitorContext } from 'tspoon';
import { VariableDeclarationVisitor } from './VariableDeclarationVisitor';
import * as generate from '../generators';
import * as utils from '../utils';

export class VariableStatementVisitor implements Visitor {

  public filter(node: ts.Node): boolean {
    return node.kind === ts.SyntaxKind.VariableDeclaration;
  }

  public visit(node: ts.VariableDeclaration, context: VisitorContext, traverse: (...visitors: Visitor[]) => void): void {
    traverse(new VariableDeclarationVisitor());
  }

}
