import * as ts from 'typescript';
import { Mutator } from './Mutator';

// TODO: declaration merging with all declarations
export class InterfaceDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.InterfaceDeclaration;

  private processed: ts.Symbol[] = [];

  public mutate(node: ts.InterfaceDeclaration): ts.Node {
    // TODO: get all declarations, merge (including extends), add to processed,
    // replace future mutations simply with IFace = IFace or remove it completely.
    //
    // const sym = this.context.checker.getSymbolAtLocation(node.name);
    // console.log(sym.getName());
    // console.log(sym.getDeclarations().length);
    // console.log(ts.SyntaxKind[sym.declarations[0].kind]);
    //
    // sym.declarations.forEach(dec => {
    //   const s = this.context.checker.getSymbolAtLocation(dec.name)
    //   console.log(sym === s);
    // })
    //
    // console.log();

    const extendsClause = this.getExtendsClause(node);
    const intersections = extendsClause && extendsClause.types && extendsClause.types.map(expr => expr.expression);

    let typeAliasExpressions: ts.Expression = this.factory.asObject(this.factory.typeElementsReflection(node.members));

    if (this.context.hasSelfReference(node)) {
      typeAliasExpressions = this.factory.selfReference(node.name, typeAliasExpressions);
    }

    if (intersections) {
      (intersections as ts.Expression[]).push(typeAliasExpressions)
      typeAliasExpressions = this.factory.intersect(intersections);
    }

    const substitution = ts.createVariableStatement(
      node.modifiers,
      ts.createVariableDeclarationList(
        [
          ts.createVariableDeclaration(
            node.name,
            undefined,
            this.factory.interfaceSubstitution(node.name, typeAliasExpressions)
          )
        ],
        ts.NodeFlags.Const
      )
    );

    this.context.addVisited(substitution, true);

    return substitution;
  }

  private getExtendsClause(node: ts.InterfaceDeclaration): ts.HeritageClause {
    return node.heritageClauses && node.heritageClauses.find(clause => {
      if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
        return true;
      }
    })
  }

  private findDeclarations(node: ts.InterfaceDeclaration) {

  }

}
