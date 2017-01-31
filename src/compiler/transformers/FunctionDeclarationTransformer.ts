import * as ts from 'typescript';
import { Transformer } from './Transformer';
import { generator } from '../utils';

export class FunctionDeclarationTransformer extends Transformer {

  protected substitution = ts.SyntaxKind.FunctionDeclaration;

  protected transform(node: ts.FunctionDeclaration, context: ts.EmitContext): ts.Node {
    console.log('function transform');

    const typeDefinitions: ts.VariableDeclaration[] = [];
    const typeChecks: ts.ExpressionStatement[] = [];

    if (!node.parameters) {
      return node;
    }

    for (const param of node.parameters) {
      if (param.type === undefined) {
        continue;
      }

      const paramName = param.name.getText();
      const typeDefinition = generator.createTypeDefinition(param.type, `_${paramName}Type`);

      const typeCheck = ts.factory.createStatement(
        ts.factory.createCall(
          ts.factory.createPropertyAccess(
            ts.factory.createCall(
              ts.factory.createPropertyAccess(
                ts.factory.createIdentifier('t'),
                ts.factory.createIdentifier('param'),
              ),
              [],
              [
                ts.factory.createLiteral(paramName),
                ts.factory.createIdentifier(`_${paramName}Type`),
                param.questionToken === undefined ? ts.factory.createLiteral(false) : ts.factory.createLiteral(true),
              ],
            ),
            ts.factory.createIdentifier('assert'),
          ),
          [],
          [ts.factory.createIdentifier(paramName)],
        ),
      );

      ts.factory.createStatement(generator.createTypeCall(`_${paramName}Type`, 'assert', [ts.factory.createIdentifier(paramName)]));

      typeDefinitions.push(typeDefinition);
      typeChecks.push(typeCheck);
    }

    let returnTypeDefinition: ts.Statement[] = [];
    let returnTypeCheck: ts.Statement[] = [];
    if (node.type !== undefined) {
      returnTypeDefinition.push(ts.factory.createVariableStatement(
        [],
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              '_returnType',
              undefined,
              ts.factory.createCall(
                ts.factory.createPropertyAccess(
                  ts.factory.createIdentifier('t'),
                  ts.factory.createIdentifier('return'),
                ),
                [],
                [generator.createTypeCalls(node.type)],
              ),
            ),
          ],
          undefined,
          ts.NodeFlags.Const,
        ),
      ));


    }

    const paramList = ts.factory.createVariableStatement(
      [],
      ts.factory.createVariableDeclarationList(typeDefinitions, undefined, ts.NodeFlags.Let),
    );

    const body = node.body;
    body.statements.unshift(paramList, ...returnTypeDefinition, ...typeChecks);

    const updatedNode = ts.factory.updateFunctionDeclaration(
      node, node.decorators, node.modifiers, node.name, node.typeParameters,
      node.parameters, node.type, body,
    );

    return updatedNode;
  }

}

export default FunctionDeclarationTransformer;
