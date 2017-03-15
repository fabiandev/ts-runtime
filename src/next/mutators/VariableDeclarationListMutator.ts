import * as ts from 'typescript';
import * as generator from '../generator';
import { Mutator } from './Mutator';
import { MutationContext } from '../context';

export class VariableDeclarationListMutator extends Mutator {

  protected kind = ts.SyntaxKind.VariableDeclarationList;

  public mutate(node: ts.VariableDeclarationList, context: MutationContext): ts.Node {
    if (!node.declarations) {
      return node;
    }

    const declarations: ts.VariableDeclaration[] = [];

    for (const declaration of node.declarations) {
      const transformed = this.transformDeclaration(declaration, context);
      transformed.forEach(n => context.addVisited(n, true));
      declarations.push(...transformed);
    }

    return ts.updateVariableDeclarationList(node, declarations);
  }

  private transformDeclaration(node: ts.VariableDeclaration, context: MutationContext): ts.VariableDeclaration[] {
    if (context.wasVisited(node)) {
      return [node];
    }

    const isConst = node.parent && node.parent.flags === ts.NodeFlags.Const;

    if (!node.type) {
      if (isConst) {
        return this.transformUntypedConstDeclaration(node);
      }

      return this.transformUntypedLetDeclaration(node);
    }

    if (isConst) {
      return this.transformConstDeclaration(node);
    }

    return this.transformLetDeclaration(node);
  }

  private transformLetDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    const nodeName = node.name.getText();
    const typeDefinition = generator.typeDefinition(`_${nodeName}Type`, node.type);

    if (!node.initializer) {
      return [typeDefinition, node];
    }

    const initializer = generator.propertyAccessCall(`_${nodeName}Type`, 'assert', node.initializer);
    const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [typeDefinition, assignment];
  }

  private transformConstDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    const nodeName = node.name.getText();
    const typeCalls = generator.typeAssertion(node.type);

    const initializer = ts.createCall(
      ts.createPropertyAccess(typeCalls, 'assert'), [], [node.initializer],
    );

    const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [assignment];
  }

  private transformUntypedLetDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    return [node];
  }

  private transformUntypedConstDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    return [node];
  }

}
