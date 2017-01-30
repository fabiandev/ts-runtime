import * as ts from 'typescript/built/local/typescript';
import { Transformer } from './Transformer';
import { generator } from '../utils';

export class VariableDeclarationTransformer extends Transformer {

  protected substitution = ts.SyntaxKind.VariableDeclarationList;

  protected transform(node: ts.VariableDeclarationList): ts.Node {
    console.log('var transform');
    const declarations: ts.VariableDeclaration[] = [];

    if (!node.declarations) {
      return node;
    }

    for (const declaration of node.declarations) {
      if (declaration.initializer)
      if (declaration.kind === ts.SyntaxKind.VariableDeclaration) {
        declarations.push(...this.transformDeclaration(declaration));
        continue;
      }

      declarations.push(declaration);
    }

    return ts.factory.updateVariableDeclarationList(node, declarations);
  }

  private transformDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    if (this.wasGenerated(node)) {
      return [node];
    }

    if (!node.type) {
      if (node.parent.flags === ts.NodeFlags.Const) {
        return this.transformUntypedConstDeclaration(node);
      }

      return this.transformUntypedLetDeclaration(node);
    }

    if (node.parent.flags === ts.NodeFlags.Const) {
      return this.transformConstDeclaration(node);
    }

    return this.transformLetDeclaration(node);
  }

  private transformLetDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    const nodeName = node.name.getText();
    const typeDefinition = generator.createTypeDefinition(node.type, `_${nodeName}Type`);

    if (!node.initializer) {
      return [typeDefinition, node];
    }

    const initializer = generator.createTypeCall(`_${nodeName}Type`, 'assert', [node.initializer]);
    const assignment = ts.factory.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [typeDefinition, assignment];
  }

  private transformConstDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    const nodeName = node.name.getText();
    const typeCalls = generator.createTypeCalls(node.type);

    const initializer = ts.factory.createCall(
      ts.factory.createPropertyAccess(typeCalls, 'assert'), [], [node.initializer],
    );

    const assignment = ts.factory.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [assignment];
  }

  private transformUntypedLetDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    const nodeName = node.name.getText();
    const typeDefinition = generator.createTypeDefinition(
      'any',
      `_${nodeName}Type`,
    );

    if (!node.initializer) {
      return [typeDefinition, node];
    }

    const initializer = generator.createTypeCall(`_${nodeName}Type`, 'assert', [node.initializer]);
    const assignment = ts.factory.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [typeDefinition, assignment];
  }

  private transformUntypedConstDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    // return [node];
    const nodeName = node.name.getText();
    const typeCalls = generator.createTypeCall('t', 'any');

    const initializer = ts.factory.createCall(
      ts.factory.createPropertyAccess(typeCalls, 'assert'), [], [node.initializer],
    );

    const assignment = ts.factory.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [assignment];
  }

}

export default VariableDeclarationTransformer;
