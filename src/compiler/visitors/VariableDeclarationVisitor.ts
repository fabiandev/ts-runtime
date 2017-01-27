import * as ts from 'typescript';
import { Visitor, VisitorContext } from 'tspoon';
import * as generate from '../generators';
import * as utils from '../utils';

export class VariableDeclarationVisitor implements Visitor {

  public filter(node: ts.Node): boolean {
    return node.kind === ts.SyntaxKind.VariableDeclaration;
  }

  public visit(node: ts.VariableDeclaration, context: VisitorContext, traverse: (...visitors: Visitor[]) => void): void {
    const typeDefinition = generate.typeDefinition(node.type, node.name.getText());

    if (typeDefinition !== null) {
      context.insertLine(node.parent.getStart(), utils.ast.toString(typeDefinition));
    }

    if (node.initializer !== undefined) {
      const assignment = generate.variableAssignment(node.name.getText(), node.initializer);
      context.replace(node.getStart(), node.getEnd(), utils.ast.toString(assignment));
    }
  }

}
