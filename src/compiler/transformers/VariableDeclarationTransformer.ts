import * as ts from 'typescript';
import { VisitorContext } from 'tspoon';
import { Transformer } from './Transformer';

export class VariableDeclarationTransformer extends Transformer {

  constructor(protected node: ts.VariableDeclaration, context: VisitorContext) {
    super(node, context);
  }

  public getTypeKind(): ts.SyntaxKind {
    return !this.node.type ? ts.SyntaxKind.AnyKeyword : this.node.type.kind;
  }

  public getReplacement(): string {
    const typeKind = this.getTypeKind();
    return '';
  }

  public replace() {

  }

}
