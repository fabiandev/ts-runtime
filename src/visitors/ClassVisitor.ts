import * as ts from 'typescript';
import { Visitor, VisitorContext } from 'tspoon';

export const ClassVisitor: Visitor = {
  filter: function filter(node: ts.Node) {
    return node.kind === ts.SyntaxKind.ClassDeclaration;
  },
  visit: function visit(node: ts.ClassDeclaration, context: VisitorContext) {
    if (!node.heritageClauses) return;

    const implementing: string[] = [];

    for (const clause of node.heritageClauses) {
      if (clause.token !== ts.SyntaxKind.ImplementsKeyword) continue;
      if (!clause.types) continue;

      for (const type of clause.types) {
        implementing.push(type.expression.getText());
      }
    }

    for (const impl of implementing) {
      context.insertLine(
        node.getEnd(),
        `__implement(${node.name.text}, ${impl});`,
      );
    }
  },
};
