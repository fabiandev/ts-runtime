import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

export class BinaryExpressionMutator extends Mutator {

  protected kind = ts.SyntaxKind.BinaryExpression;

  private assignmentOperators: ts.AssignmentOperator[] = [
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
    ts.SyntaxKind.GreaterThanGreaterThanEqualsToken
  ];

  protected mutate(node: ts.BinaryExpression): ts.Node {
    if (node.left.kind !== ts.SyntaxKind.Identifier) {
      return node;
    }

    if (this.isAssignmentOperator(node)) {
      return node;
    }

    if (!util.isBindingName(node.left)) {
      return node;
    }

    if (this.context.isAny(node.left)) {
      return node;
    }

    const name = this.context.getTypeDeclarationName(node.left as ts.BindingName);
    const right = this.factory.typeAssertion(name, node.right);

    return this.map(node, ts.updateBinary(node, node.left, right));
  }

  private isAssignmentOperator(node: ts.BinaryExpression): boolean {
    return this.assignmentOperators.indexOf(node.operatorToken.kind as any) !== -1;
  }

}
