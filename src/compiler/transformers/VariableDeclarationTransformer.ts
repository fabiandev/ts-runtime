import * as ts from 'typescript/built/local/typescript';
import { Transformer } from './Transformer';
import * as generator from '../generator';

export class VariableDeclarationTransformer extends Transformer {

  protected substitution = ts.SyntaxKind.VariableDeclarationList;

  protected visited: ts.Node[] = [];

  public onSubstituteNode(context: ts.EmitContext, node: ts.VariableDeclarationList): ts.Node {
    const declarations: ts.VariableDeclaration[] = [];

    for (const declaration of node.declarations) {
      declarations.push(...this.processDeclaration(declaration));
    }

    return ts.factory.updateVariableDeclarationList(node, declarations);
  }

  private processDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    if (!node.type) {
      return [node];
    }

    if (node.parent.flags === ts.NodeFlags.Const) {
      return this.processConstDeclaration(node);
    }

    return this.processLetDeclaration(node);
  }

  private processLetDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    const nodeName = node.name.getText();
    const typeDefinition = generator.createTypeDefinition(node.type, `_${nodeName}Type`);

    if (!node.initializer) {
      return [typeDefinition, node];
    }

    const initializer = generator.createTypeCall(`_${nodeName}Type`, 'assert', [node.initializer]);
    const assignment = ts.factory.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [typeDefinition, assignment];
  }

  private processConstDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    const nodeName = node.name.getText();
    const typeDefinition = generator.createTypeDefinition(node.type, nodeName);

    const initializer = ts.factory.createCall(
      ts.factory.createPropertyAccess(ts.factory.createCall(
        ts.factory.createPropertyAccess(ts.factory.createIdentifier('t'), 'number'), [], [],
      ), 'assert'), [], [node.initializer],
    );

    const assignment = ts.factory.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [assignment];
  }

}
