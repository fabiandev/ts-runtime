import * as ts from 'typescript';
import { Visitor, VisitorContext } from 'tspoon';
import * as generate from '../generators';
import * as utils from '../utils';

export class VariableDeclarationVisitor implements Visitor {

  public filter(node: ts.Node): boolean {
    return node.kind === ts.SyntaxKind.ExpressionStatement;
  }

  public visit(node: ts.ExpressionStatement, context: VisitorContext, traverse: (...visitors: Visitor[]) => void): void {

  }

}
