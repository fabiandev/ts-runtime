import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class VariableDeclarationListMutator extends Mutator {

  protected kind = ts.SyntaxKind.VariableDeclarationList;

  private skip = [
    ts.SyntaxKind.ForOfStatement,
    ts.SyntaxKind.ForInStatement,
    ts.SyntaxKind.CatchClause,
    ts.SyntaxKind.ImportClause
  ];

  private constDeclaration: boolean;

  protected mutate(node: ts.VariableDeclarationList): ts.Node {
    if (!node.declarations) {
      return node;
    }

    // TODO: assert within loop; make ForOfLoopMutator etc.
    if (node.parent && this.skip.indexOf(node.parent.kind) !== -1) {
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

    if (this.context.isAny(node.type)) {
      return [node];
    }

    if (!node.initializer /*|| this.declarationTypeIsInitializerType(node)*/) {
      return [typeDefinition, node];
    }

    const initializer = this.factory.typeAssertion(nodeName, node.initializer);
    const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);

    this.context.addVisited(typeDefinition, true);
    this.context.addVisited(assignment, true, node.initializer);

    return [typeDefinition, assignment];
  }

  private transformConstDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    if (!node.initializer || node.initializer.kind === ts.SyntaxKind.FunctionExpression) {
      return [node];
    }

    if (this.context.isAny(node.type)) {
      return [node];
    }

    if (!node.type /*|| this.declarationTypeIsInitializerType(node)*/) {
      return [node];
    }

    const nodeName = this.context.getTypeDeclarationName(node.name.getText());

    const initializer = this.factory.typeReflectionAndAssertion(node.type, node.initializer);
    const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);

    this.context.addVisited(assignment, true, node.initializer);

    return [assignment];
  }

  private declarationTypeIsInitializerType(node: ts.VariableDeclaration): boolean {
    return this.context.isSafeAssignment(node.name, node.initializer);
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
