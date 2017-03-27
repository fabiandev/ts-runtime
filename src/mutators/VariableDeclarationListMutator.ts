import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class VariableDeclarationListMutator extends Mutator {

  protected kind = ts.SyntaxKind.VariableDeclarationList;

  public mutate(node: ts.VariableDeclarationList): ts.Node {
    if (!node.declarations) {
      return node;
    }

    const declarations: ts.VariableDeclaration[] = [];

    for (const declaration of node.declarations) {
      const transformed = this.transform(declaration);
      transformed.forEach(n => this.context.addVisited(n, true, n.initializer));
      declarations.push(...transformed);
    }

    return ts.updateVariableDeclarationList(node, declarations);
  }

  private transform(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    if (this.context.wasVisited(node)) {
      return [node];
    }

    const isConst = node.parent && node.parent.flags === ts.NodeFlags.Const;

    if (!node.type) {
      if (isConst) {
        return this.transformUntypedConstDeclaration(node);
      }

      return this.transformUntypedDeclaration(node);
    }

    if (isConst) {
      return this.transformConstDeclaration(node);
    }

    return this.transformDeclaration(node);
  }

  private transformDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    if (!this.context.options.assertAny && node.type.kind === ts.SyntaxKind.AnyKeyword) {
      return [node];
    }

    const nodeName = this.context.getTypeDeclarationName(node.name.getText());
    const typeDefinition = this.context.generator.typeDeclaration(nodeName, node.type);

    if (!node.initializer) {
      return [typeDefinition, node];
    }

    const initializer = this.context.generator.typeAssertion(nodeName, node.initializer);
    const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [typeDefinition, assignment];
  }

  private transformConstDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    if (!this.context.options.assertAny && node.type.kind === ts.SyntaxKind.AnyKeyword) {
      return [node];
    }

    const nodeName = this.context.getTypeDeclarationName(node.name.getText());

    const initializer = this.context.generator.typeDefinitionAndAssertion(node.type, node.initializer);
    const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [assignment];
  }

  private transformUntypedDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    const nodeName = this.context.getTypeDeclarationName(node.name.getText());
    const implicitType = this.context.getImplicitTypeNode(node.name);

    if (!this.context.options.assertAny && implicitType.kind === ts.SyntaxKind.AnyKeyword) {
      return [node];
    }

    const typeDefinition = this.context.generator.typeDeclaration(
      nodeName,
      implicitType
    );

    if (!node.initializer) {
      return [typeDefinition, node];
    }

    const initializer = this.context.generator.typeAssertion(nodeName, [node.initializer]);
    const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [typeDefinition, assignment];
  }

  private transformUntypedConstDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    const nodeName = this.context.getTypeDeclarationName(node.name.getText());
    const implicitType = this.context.getImplicitTypeNode(node.name);

    if (!this.context.options.assertAny && implicitType.kind === ts.SyntaxKind.AnyKeyword) {
      return [node];
    }

    const initializer = this.context.generator.typeDefinitionAndAssertion(implicitType, node.initializer);
    const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [assignment];
  }

}
