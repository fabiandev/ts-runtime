import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

export class BlockLikeMutator extends Mutator {

  protected kind: ts.SyntaxKind[] = [];

  protected mutate(node: ts.BlockLike): ts.BlockLike {
    return node;
  }

  // protected kind = [
  //   ts.SyntaxKind.SourceFile,
  //   ts.SyntaxKind.Block,
  //   ts.SyntaxKind.ModuleBlock,
  //   ts.SyntaxKind.CaseClause,
  //   ts.SyntaxKind.DefaultClause
  // ];

  // protected mutate(node: ts.BlockLike): ts.BlockLike {
  //   const statements: ts.Statement[] = [];
  //
  //   let substitution: ts.BlockLike;
  //   let needsUpdate = false;
  //
  //   for (let statement of node.statements) {
  //     if (statement.kind === ts.SyntaxKind.FunctionDeclaration) {
  //       statements.push(...this.mutateFunctionDeclaration(statement as ts.FunctionDeclaration));
  //       needsUpdate = true;
  //       continue;
  //     }
  //
  //     statements.push(statement);
  //   }
  //
  //   switch (node.kind) {
  //     case this.kind[0]:
  //       if (needsUpdate) substitution = ts.updateSourceFileNode(node as ts.SourceFile, statements);
  //       break;
  //     case this.kind[1]:
  //       if (needsUpdate) substitution = ts.updateBlock(node as ts.Block, statements);
  //       break;
  //     case this.kind[2]:
  //       if (needsUpdate) substitution = ts.updateModuleBlock(node as ts.ModuleBlock, statements);
  //       break;
  //     case this.kind[3]:
  //       if (needsUpdate) substitution = ts.updateCaseClause(node as ts.CaseClause, (node as ts.CaseClause).expression, statements);
  //       break;
  //     case this.kind[4]:
  //       if (needsUpdate) substitution = ts.updateDefaultClause(node as ts.DefaultClause, statements);
  //       break;
  //   }
  //
  //   return needsUpdate ? substitution : node;
  // }
  //
  // // TODO: implement (or possible to use parent and push annotation to its array?)
  // private mutateFunctionDeclaration(node: ts.FunctionDeclaration): ts.Statement[] {
  //   return [node];
  // }

}
