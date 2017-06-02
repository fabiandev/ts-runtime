import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

export class BlockLikeMutator extends Mutator {

  protected kind = [
    ts.SyntaxKind.SourceFile,
    ts.SyntaxKind.Block,
    ts.SyntaxKind.ModuleBlock,
    ts.SyntaxKind.CaseClause,
    ts.SyntaxKind.DefaultClause
  ];

  protected mutate(node: ts.BlockLike): ts.BlockLike {
    let needsUpdate = false;
    const statements: ts.Statement[] = [];

    for (let statement of node.statements) {
      let statementSubstitution = util.asArray(statement);

      switch (statement.kind) {
        case ts.SyntaxKind.FunctionDeclaration:
          statementSubstitution = this.annotateFunctionDeclaration(statement as ts.FunctionDeclaration);
          needsUpdate = true;
          break;
        case ts.SyntaxKind.ClassDeclaration:
          if (util.hasTypeParameters(statement)) {
            statementSubstitution = this.annotateClassDeclaration(statement as ts.ClassDeclaration);
            needsUpdate = true;
          }
          break;
        case ts.SyntaxKind.EnumDeclaration:
          statementSubstitution = this.annotateEnumDeclaration(statement as ts.EnumDeclaration);
          needsUpdate = true;
          break;
      }

      statements.push(...statementSubstitution);
    }

    return needsUpdate ? this.updateBlock(node, statements) : node;
  }

  private updateBlock(node: ts.BlockLike, statements: ts.Statement[]): ts.BlockLike {
    switch (node.kind) {
      case this.kind[0]:
        return this.map(ts.updateSourceFileNode(node as ts.SourceFile, statements), node);
      case this.kind[1]:
        return this.map(ts.updateBlock(node as ts.Block, statements), node);
      case this.kind[2]:
        return this.map(ts.updateModuleBlock(node as ts.ModuleBlock, statements), node);
      case this.kind[3]:
        return this.map(ts.updateCaseClause(node as ts.CaseClause, (node as ts.CaseClause).expression, statements), node);
      case this.kind[4]:
        return this.map(ts.updateDefaultClause(node as ts.DefaultClause, statements), node);
      default:
        return node;
    }
  }

  private annotateFunctionDeclaration(node: ts.FunctionDeclaration): ts.Statement[] {
    const annotation = ts.createStatement(
      this.factory.annotate([
        node.name,
        this.factory.functionTypeReflection(node)
      ])
    );

    return [node, annotation];
  }

  private annotateClassDeclaration(node: ts.ClassDeclaration): ts.Statement[] {
    const annotation = ts.createVariableStatement(
      undefined,
      this.factory.classTypeParameterSymbolDeclaration(node.name)
    );

    return [annotation, node];
  }

  private annotateEnumDeclaration(node: ts.EnumDeclaration): ts.Statement[] {
    const annotation = ts.createStatement(
      this.factory.annotate([
        node.name,
        this.factory.enumReflection(node)
      ])
    );

    return [node, annotation];
  }

}
