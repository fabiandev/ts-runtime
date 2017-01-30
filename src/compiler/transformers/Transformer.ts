import * as ts from 'typescript/built/local/typescript';
import { Config, DEFAULT_CONFIG } from '../../config';

export abstract class Transformer {

  public static DEFAULT_CONFIG: Config = DEFAULT_CONFIG;

  protected config: Config;

  protected visited: ts.Node[] = [];

  protected abstract substitution: ts.SyntaxKind | ts.SyntaxKind[];

  protected abstract transform(node: ts.Node, context?: ts.EmitContext): ts.Node;

  constructor(config?: Config) {
    this.config = config ? config : Transformer.DEFAULT_CONFIG;
  }

  public getSubstitutions(): ts.SyntaxKind[] {
    return !Array.isArray(this.substitution) ? [this.substitution] : this.substitution;
  }

  public getVisited() {
    return this.visited;
  }

  public process(node: ts.Node, context?: ts.EmitContext): ts.Node {
    if (this.config.skipGenerated && this.wasGenerated(node)) {
      return node;
    }

    if (this.config.skipVisited) {
      if (this.wasVisited(node)) {
        return node;
      }

      this.visited.push(node);
    }

    if (this.getSubstitutions().indexOf(node.kind) === -1) {
      return node;
    }

    return this.transform(node, context);
  }

  protected wasGenerated(node: ts.Node): boolean {
    return !node.parent;
  }

  protected wasVisited(node: ts.Node): boolean {
    return this.visited.indexOf(node) !== -1;
  }

}

export default Transformer;
