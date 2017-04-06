import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class VariableDeclarationListMutator extends Mutator {

  protected kind = ts.SyntaxKind.VariableDeclarationList;

  private constDeclaration: boolean;

  public mutate(node: ts.VariableDeclarationList): ts.Node {
    if (!node.declarations) {
      return node;
    }

    this.constDeclaration = node && node.flags === ts.NodeFlags.Const;

    const declarations: ts.VariableDeclaration[] = [];

    for (const declaration of node.declarations) {
      declarations.push(...this.transform(declaration));
    }

    return ts.updateVariableDeclarationList(node, declarations);
  }

  private transform(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    if (this.context.wasVisited(node)) {
      return [node];
    }

    let nameIsBindingPattern = false;
    switch(node.name.kind) {
      // case ts.SyntaxKind.Identifier:
      //   nameIsBindingPattern = false;
      //   break;
      case ts.SyntaxKind.ArrayBindingPattern:
      case ts.SyntaxKind.ObjectBindingPattern:
        nameIsBindingPattern = true;
        break;
    }

    if (!this.constDeclaration && nameIsBindingPattern) {
      return [node];
    }

    // if (!node.type) {
    //   if (this.constDeclaration) {
    //     return this.transformUntypedConstDeclaration(node);
    //   }
    //
    //   return this.transformUntypedDeclaration(node);
    // }

    if (this.constDeclaration) {
      return this.transformConstDeclaration(node);
    }

    return this.transformDeclaration(node);
  }

  private transformDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    const nodeName = this.context.getTypeDeclarationName(node.name.getText());
    const typeDefinition = this.factory.typeDeclaration(nodeName, node.type);

    if (!node.initializer || this.declarationTypeIsInitializerType(node)) {
      return [typeDefinition, node];
    }

    const initializer = this.factory.typeAssertion(nodeName, node.initializer);
    const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);

    this.context.addVisited(typeDefinition, true);
    this.context.addVisited(assignment, true, node.initializer);

    return [typeDefinition, assignment];
  }

  private transformConstDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    if (node.initializer.kind === ts.SyntaxKind.FunctionExpression) {
      console.log('FUNCTION');
      return [node];
    }

    if (this.declarationTypeIsInitializerType(node)) {
      return [node];
    }

    const nodeName = this.context.getTypeDeclarationName(node.name.getText());

    const initializer = this.factory.typeReflectionAndAssertion(node.type, node.initializer);
    const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);

    this.context.addVisited(assignment, true, node.initializer);

    return [assignment];
  }

  private declarationTypeIsInitializerType(node: ts.VariableDeclaration): boolean {
    return this.context.typeMatchesBaseTypeOrAny(node.type, node.initializer);
  }

  // private transformUntypedDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
  //   const nodeName = this.context.getTypeDeclarationName(node.name.getText());
  //
  //   if (!this.context.options.assertAny && node.type.kind === ts.SyntaxKind.AnyKeyword) {
  //     return [node];
  //   }
  //
  //   const typeDefinition = this.factory.typeDeclaration(
  //     nodeName,
  //     node.type
  //   );
  //
  //   if (!node.initializer) {
  //     return [typeDefinition, node];
  //   }
  //
  //   const initializer = this.factory.typeAssertion(nodeName, [node.initializer]);
  //   const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);
  //
  //   this.context.addVisited(typeDefinition, true);
  //   this.context.addVisited(assignment, true, node.initializer);
  //
  //   return [typeDefinition, assignment];
  // }
  //
  // private transformUntypedConstDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
  //   const nodeName = this.context.getTypeDeclarationName(node.name.getText());
  //
  //   if (!this.context.options.assertAny && node.type.kind === ts.SyntaxKind.AnyKeyword) {
  //     return [node];
  //   }
  //
  //   const initializer = this.factory.typeReflectionAndAssertion(node.type, node.initializer);
  //   const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);
  //
  //   this.context.addVisited(assignment, true, node.initializer);
  //
  //   return [assignment];
  // }

}
