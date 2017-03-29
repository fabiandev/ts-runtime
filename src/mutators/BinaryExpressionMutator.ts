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

  // TODO: check spec (e.g. destructuring, rest element,...)
  public mutate(node: ts.BinaryExpression): ts.Node {
    if (node.left.kind !== ts.SyntaxKind.Identifier) {
      return node;
    }

    if (this.assignmentKinds.indexOf(node.operatorToken.kind) === -1) {
      return node;
    }

    const implicitType = this.context.getImplicitTypeNode(node.left);

    if (!this.context.options.assertAny && implicitType.kind === ts.SyntaxKind.AnyKeyword) {
      return node;
    }

    // TODO: revisit as ts.Identifier (could be any expression)
    const nodeName = this.context.getTypeDeclarationName(node.left as ts.Identifier);
    const right = this.factory.typeAssertion(nodeName, node.right);

    this.context.addVisited(right, true, node.right);

    return ts.updateBinary(node, node.left, right);
  }

}
