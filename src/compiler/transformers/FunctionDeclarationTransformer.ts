import * as ts from 'typescript/built/local/typescript';
import { Transformer } from './Transformer';
import { generator } from '../utils';

export class FunctionDeclarationTransformer extends Transformer {

  protected substitution = ts.SyntaxKind.FunctionDeclaration;

  protected transform(node: ts.FunctionDeclaration, context: ts.EmitContext): ts.Node {
    console.log('function transform');
    // if (true === true) return node;

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

    const paramList = ts.factory.createVariableStatement(
      [],
      ts.factory.createVariableDeclarationList(typeDefinitions, undefined, ts.NodeFlags.Let),
    );

    node.body.statements.unshift(paramList, ...typeChecks);

    const orig = generator.createTypeCall('a', 'test');
    const exp = ts.factory.createStatement(orig);
    // const decorators: ts.Decorator[] = Array.isArray(node.decorators) ? node.decorators : [];
    // const decorator = ts.factory.createSynthesizedNode(ts.SyntaxKind.Decorator) as ts.Decorator;
    // decorator.expression = generator.createTypeCall('a', 'test');
    // decorators.push(decorator);

    const module = ts.factory.createSynthesizedNode(ts.SyntaxKind.SyntaxList) as ts.SyntaxList;

    const updatedNode = ts.factory.updateFunctionDeclaration(
      node, node.decorators, node.modifiers, node.name, node.typeParameters,
      node.parameters, node.type, node.body,
    );

    const parent = node.parent as any;
    parent.statements.push(exp);

    module._children = ts.factory.createNodeArray([updatedNode, exp]);

    return updatedNode;
  }

}

export default FunctionDeclarationTransformer;
