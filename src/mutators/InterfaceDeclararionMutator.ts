import * as ts from 'typescript';
import { Mutator } from './Mutator';
import { ScanAttributes } from '../scanner';

export class InterfaceDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.InterfaceDeclaration;

  protected mutate(node: ts.InterfaceDeclaration): ts.Node {
    const nodeAttributes = this.scanner.getAttributes(node);

    if (this.willBeDeclaredInClass(nodeAttributes.typeAttributes.declarations) || this.context.wasProcessed(nodeAttributes.typeAttributes.symbol)) {
      return null;
    }

    // let typeAliasExpressions: ts.Expression = this.factory.asObject(
    //   this.factory.mergedTypeElementsReflection(
    //     this.mergeDeclarations(props)
    //   )
    // );
    //
    // if (this.context.hasSelfReference(node)) {
    //   typeAliasExpressions = this.factory.selfReference(node.name, typeAliasExpressions);
    // }
    //
    // // const intersections = this.mergeExtendsClauses(nodeSymbol).map(intersection => this.factory.asRef(intersection));
    //
    // // if (intersections.length >= 1) {
    // //   (intersections as ts.Expression[]).push(typeAliasExpressions)
    // //   typeAliasExpressions = this.factory.intersect(intersections);
    // // }
    //
    // const substitution = ts.createVariableStatement(
    //   node.modifiers,
    //   ts.createVariableDeclarationList(
    //     [
    //       ts.createVariableDeclaration(
    //         node.name,
    //         undefined,
    //         this.factory.interfaceSubstitution(node.name, typeAliasExpressions)
    //       )
    //     ],
    //     ts.NodeFlags.Const
    //   )
    // );
    //
    // this.context.addVisited(substitution, true);
    // this.processed.push(props.type.symbol);
    //
    // return substitution;

    const substitution = this.factory.typeSubstitution(node);

    this.context.addVisited(substitution, true);
    this.context.processed.push(nodeAttributes.type.symbol);

    return substitution;
  }

  // private getExtendsClause(node: ts.InterfaceDeclaration): ts.HeritageClause {
  //   return node.heritageClauses && node.heritageClauses.find(clause => {
  //     if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
  //       return true;
  //     }
  //   })
  // }

  // private mergeExtendsClauses(nodeSymbol: ts.Symbol): ts.Expression[] {
  //   const existing: string[] = [];
  //   const expressions: ts.Expression[] = [];
  //
  //   for (let declaration of (nodeSymbol.getDeclarations() || []) as ts.InterfaceDeclaration[]) {
  //     const extendsClause = this.getExtendsClause(declaration);
  //     const intersections = extendsClause && extendsClause.types && extendsClause.types
  //       .map(expr => {
  //         existing.push(expr.expression.getText());
  //         return expr.expression;
  //       })
  //       .filter(expr => {
  //         return existing.indexOf(expr.getText()) !== -1;
  //       });
  //
  //     if (intersections) {
  //       expressions.push(...intersections);
  //     }
  //   }
  //
  //   return expressions;
  // }

  // private mergeDeclarations(props: ScanProperties): ts.TypeElement[] {
  //   // const existing: string[] = [];
  //   // const merged: ts.TypeElement[] = [];
  //
  //   const merged: Set<ts.TypeElement> = new Set();
  //
  //   (props.type.type.getProperties() || []).forEach(sym => {
  //     for (let typeElement of ((sym.getDeclarations() || []) as ts.TypeElement[])) {
  //       merged.add(typeElement);
  //     }
  //   });
  //
  //   // for (let declaration of (nodeSymbol.getDeclarations() || []) as ts.InterfaceDeclaration[]) {
  //   //   declaration.members.forEach(member => {
  //   //     const text = member.getText();
  //   //
  //   //     if (existing.indexOf(text) === -1) {
  //   //       existing.push(text);
  //   //       merged.push(member);
  //   //     }
  //   //   });
  //   // }
  //
  //   return Array.from(merged);
  // }

  private willBeDeclaredInClass(declarations: ts.Declaration[]) {
    // throw new Error('Class/Interface declaration merging not supported.');

    for(let declaration of declarations) {
      if (declaration.kind === ts.SyntaxKind.ClassDeclaration) {
        return true;
      }
    }

    return false;
  }

}
