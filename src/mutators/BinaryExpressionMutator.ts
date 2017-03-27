import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class BinaryExpressionMutator extends Mutator {

  protected kind = ts.SyntaxKind.BinaryExpression;

  private assignmentKinds: ts.SyntaxKind[] = [
    ts.SyntaxKind.EqualsToken,
    ts.SyntaxKind.PlusEqualsToken,
    ts.SyntaxKind.MinusEqualsToken,
    ts.SyntaxKind.AsteriskAsteriskEqualsToken,
    ts.SyntaxKind.AsteriskEqualsToken,
    ts.SyntaxKind.SlashEqualsToken,
    ts.SyntaxKind.PercentEqualsToken,
    ts.SyntaxKind.AmpersandEqualsToken,
    ts.SyntaxKind.BarEqualsToken,
    ts.SyntaxKind.CaretEqualsToken,
    ts.SyntaxKind.LessThanLessThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ];

  public mutate(node: ts.BinaryExpression): ts.Node {
    if (this.assignmentKinds.indexOf(node.operatorToken.kind) === -1) {
      return node;
    }


    if (node.left.kind !== ts.SyntaxKind.Identifier) {
      return node;
    }

    const implicitType = this.context.getImplicitTypeNode(node.left);

    if (!this.context.options.assertAny && implicitType.kind === ts.SyntaxKind.AnyKeyword) {
      return node;
    }

    const nodeName = this.context.getTypeDeclarationName(node.left as ts.Identifier);
    const right = this.context.generator.typeAssertion(nodeName, node.right);

    this.context.addVisited(right, true, node.right);

    return ts.updateBinary(node, node.left, right);
  }

}
