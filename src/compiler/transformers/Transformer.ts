import * as ts from 'typescript/built/local/typescript';
import TransformerConfig from './TransformerConfig';
import DEFAULT_CONFIG from './default_config';

export abstract class Transformer {

  protected config: TransformerConfig;

  protected visited: ts.Node[] = [];

  protected abstract substitution: ts.SyntaxKind | ts.SyntaxKind[];

  protected abstract transform(node: ts.Node, context?: ts.EmitContext): ts.Node;

  constructor(config?: TransformerConfig) {
    this.config = config ? config : DEFAULT_CONFIG;
  }

  public getSubstitutions(): ts.SyntaxKind[] {
    return !Array.isArray(this.substitution) ? [this.substitution] : this.substitution;
  }

  public getVisited() {
    return this.visited;
  }

  public process(node: ts.Node, context?: ts.EmitContext): ts.Node {
    if (this.config.skipVisited) {
      if (this.visited.indexOf(node) !== -1) {
        return node;
      }

      this.visited.push(node);
    }

    if (this.getSubstitutions().indexOf(node.kind) === -1) {
      return node;
    }

    return this.transform(node, context);
  }

}

export default Transformer;
