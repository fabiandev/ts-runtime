import * as ts from 'typescript';
import Transformer from './Transformer';
import { generator } from '../utils';

type HasStatementsNode = ts.SourceFile | ts.Block | ts.ModuleBlock | ts.CaseClause | ts.DefaultClause;
export { HasStatementsNode };

export class HasStatementsTransformer extends Transformer {

  protected substitution: ts.SyntaxKind[] = [
    ts.SyntaxKind.SourceFile,
    ts.SyntaxKind.Block,
    ts.SyntaxKind.ModuleBlock,
    ts.SyntaxKind.CaseClause,
    ts.SyntaxKind.DefaultClause,
  ];

  protected transform(node: HasStatementsNode): ts.Node {
    if (!Array.isArray(node.statements)) {
      return node;
    }

    const statements: ts.NodeArray<ts.Statement> = node.statements;

    let i = 0;
    for (const statement of node.statements) {
      if (statement.kind !== ts.SyntaxKind.FunctionDeclaration) {
        continue;
      }

      const annotation = this.createFunctionAnnotation(statement as ts.FunctionDeclaration);

      statements.splice(++i, 0, annotation);
    }

    node.statements = statements;

    return node;
  }

  private createFunctionAnnotation(node: ts.FunctionDeclaration): ts.Statement {
    const returnType = node.type;

    const args: ts.CallExpression[] = [];

    for (const param of node.parameters) {
      args.push(ts.factory.createCall(
        ts.factory.createPropertyAccess(
          ts.factory.createIdentifier('t'),
          ts.factory.createIdentifier('param'),
        ),
        [],
        [
          ts.factory.createLiteral(param.name.getText()),
          generator.createTypeCalls(param.type),
        ],
      ));
    }

    if (node.type !== undefined) {
      args.push(ts.factory.createCall(
        ts.factory.createPropertyAccess(
          ts.factory.createIdentifier('t'),
          ts.factory.createIdentifier('return'),
        ),
        [],
        [
          generator.createTypeCalls(node.type),
        ],
      ));
    }

    const annotation = ts.factory.createStatement(
      ts.factory.createCall(
        ts.factory.createPropertyAccess(
          ts.factory.createIdentifier('t'),
          ts.factory.createIdentifier('annotate'),
        ),
        [],
        [
          ts.factory.createIdentifier(node.name.getText()),
          ts.factory.createCall(
            ts.factory.createPropertyAccess(
              ts.factory.createIdentifier('t'),
              ts.factory.createIdentifier('function'),
            ),
            [],
            args,
          ),
        ],
      ),
    );

    return annotation;
  }

}

export default HasStatementsTransformer;
