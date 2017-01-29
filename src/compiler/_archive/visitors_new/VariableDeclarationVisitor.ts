import * as ts from 'typescript/built/local/typescript';
import { Visitor } from './Visitor';
import * as generator from '../generator';

export class VariableDeclarationVisitor extends Visitor {

  public filter(node: ts.Node): boolean {
    return node.kind === ts.SyntaxKind.VariableDeclaration;
  }

  public visit(node: ts.VariableDeclaration): ts.Node {
    if (!node.type) {
      return node;
    }

    const nodeName = node.name.getText();
    const def = generator.typeDefinition(node.type, nodeName);

    const val = ts.factory.createCall(
      ts.factory.createPropertyAccess(ts.factory.createIdentifier(`_${nodeName}Type`), 'assert'),
      [],
      [node.initializer],
    );

    const check = ts.factory.updateVariableDeclaration(node, node.name, node.type, val);

    const list = ts.factory.createVariableDeclarationList([def, check]);

    return list;
  }

}
