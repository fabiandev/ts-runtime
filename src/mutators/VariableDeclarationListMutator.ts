import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

export class VariableDeclarationListMutator extends Mutator {

  protected kind = ts.SyntaxKind.VariableDeclarationList;

  private incompatibleParents = [
    ts.SyntaxKind.ForOfStatement,
    ts.SyntaxKind.ForInStatement,
    ts.SyntaxKind.CatchClause,
    ts.SyntaxKind.ImportClause
  ];

  protected mutate(node: ts.VariableDeclarationList): ts.Node {
    if (!this.shouldTransform(node)) {
      return node;
    }

    const declarations: ts.VariableDeclaration[] = [];

    for (const declaration of node.declarations) {
      declarations.push(...this.transform(declaration));
    }

    return ts.updateVariableDeclarationList(node, declarations);
  }

  private transform(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    if (!ts.isIdentifier(node.name)) {
      return [node];
    }

    const isConstDeclaration = util.hasFlag(node.parent, ts.NodeFlags.Const);

    if (isConstDeclaration) {
      return this.transformConstDeclaration(node);
    }

    return this.transformDeclaration(node);
  }

  private transformDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    if (this.context.isAny(node.type)) {
      return [node];
    }

    const nodeName = this.context.getTypeDeclarationName((node.name as ts.Identifier).text);
    const typeDefinition = this.factory.typeDeclaration(nodeName, node.type);

    if (!node.initializer) {
      return [typeDefinition, node];
    }

    const initializer = this.factory.typeAssertion(nodeName, node.initializer);
    const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [typeDefinition, assignment];
  }

  private transformConstDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration[] {
    if (!node.initializer || !node.type || this.context.isAny(node.type)) {
      return [node];
    }

    const nodeName = this.context.getTypeDeclarationName((node.name as ts.Identifier).text);
    const initializer = this.factory.typeReflectionAndAssertion(node.type, node.initializer);
    const assignment = ts.updateVariableDeclaration(node, node.name, node.type, initializer);

    return [assignment];
  }

  private shouldTransform(node: ts.VariableDeclarationList): boolean {
    if (!node.declarations) {
      return false;
    }

    if (node.parent && this.incompatibleParents.indexOf(node.parent.kind) !== -1) {
      return false;
    }

    return true;
  }

}
