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
    const statements: ts.Statement[] = [];

    let substitution: ts.BlockLike;
    let needsUpdate = false;

    for (let statement of node.statements) {
      if (statement.kind === ts.SyntaxKind.FunctionDeclaration) {
        statements.push(...this.annotateFunctionDeclaration(statement as ts.FunctionDeclaration));
        needsUpdate = true;
        continue;
      }

      if (statement.kind === ts.SyntaxKind.ClassDeclaration) {
        const typeParameters = (statement as ts.ClassDeclaration).typeParameters;
        if (typeParameters && typeParameters.length > 0) {
          statements.push(...this.annotateClassDeclaration(statement as ts.ClassDeclaration));
          needsUpdate = true;
          continue;
        }
      }

      if (statement.kind === ts.SyntaxKind.EnumDeclaration) {
        statements.push(...this.annotateEnumDeclaration(statement as ts.EnumDeclaration));
        needsUpdate = true;
        continue;
      }

      statements.push(statement);
    }

    if (needsUpdate) {
      switch (node.kind) {
        case this.kind[0]:
          substitution = ts.updateSourceFileNode(node as ts.SourceFile, statements);
          break;
        case this.kind[1]:
          substitution = ts.updateBlock(node as ts.Block, statements);
          break;
        case this.kind[2]:
          substitution = ts.updateModuleBlock(node as ts.ModuleBlock, statements);
          break;
        case this.kind[3]:
          substitution = ts.updateCaseClause(node as ts.CaseClause, (node as ts.CaseClause).expression, statements);
          break;
        case this.kind[4]:
          substitution = ts.updateDefaultClause(node as ts.DefaultClause, statements);
          break;
      }
    }

    return needsUpdate ? substitution : node;
  }

  private annotateFunctionDeclaration(node: ts.FunctionDeclaration): ts.Statement[] {
    const annotation = ts.createStatement(this.factory.libCall(
      'annotate',
      [
        node.name,
        this.factory.functionTypeReflection(node)
      ]
    ));

    this.context.addVisited(annotation, true);

    return [node, annotation];
  }

  private annotateClassDeclaration(node: ts.ClassDeclaration): ts.Statement[] {
    const annotation = ts.createVariableStatement(
      undefined,
      ts.createVariableDeclarationList([ts.createVariableDeclaration(
        this.context.getTypeSymbolDeclarationName(node.name),
        undefined,
        ts.createCall(
          ts.createIdentifier('Symbol'),
          undefined,
          [ts.createLiteral(this.context.getTypeSymbolDeclarationInitializer(node.name))]
        )
      )], ts.NodeFlags.Const));

    this.context.addVisited(annotation, true);

    return [annotation, node];
  }

  private annotateEnumDeclaration(node: ts.EnumDeclaration): ts.Statement[] {
    const annotation = ts.createStatement(this.factory.libCall(
      'annotate',
      [
        node.name,
        this.factory.enumReflection(node)
      ]
    ));

    this.context.addVisited(annotation, true);

    return [node, annotation];
  }

}
