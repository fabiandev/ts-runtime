import * as ts from 'typescript/built/local/typescript';

export abstract class Transformer {

  protected visited: ts.Node[] = [];

  protected abstract substitution: ts.SyntaxKind | ts.SyntaxKind[];

  public abstract onSubstituteNode(context: ts.EmitContext, node: ts.Node): ts.Node;

  public getSubstitutions(): ts.SyntaxKind[] {
    return !Array.isArray(this.substitution) ? [this.substitution] : this.substitution;
  }

  public process(context: ts.EmitContext, node: ts.Node): ts.Node {
    // if (this.visited.indexOf(node.parent) !== -1) {
    //   return node;
    // }

    // this.visited.push(node.parent);

    if (this.getSubstitutions().indexOf(node.kind) === -1) {
      return node;
    }

    return this.onSubstituteNode(context, node);
  }

}
