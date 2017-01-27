import * as ts from 'typescript';
import * as utils from '../utils';

export function typeDefinition(type: ts.TypeNode, name: string): any {
  const ast = utils.ast.getVariableDeclaration('const');
  const declarator = utils.ast.getVariableDeclarator(`_${name}Type`);

  declarator.init = typeCalls(type);
  ast.declarations.push(declarator);

  return ast;
}

export function typeCalls(type: ts.TypeNode): null | any {
  if (!type) {
    return null;
  }

  switch (type.kind) {
    case ts.SyntaxKind.BooleanKeyword:
    case ts.SyntaxKind.NumberKeyword:
    case ts.SyntaxKind.StringKeyword:
      {
        return utils.ast.getCallExpression(type.getText());
      }
    case ts.SyntaxKind.ArrayType:
      {
        const callExpression = utils.ast.getCallExpression('array');
        const typeNode = (type as ts.ArrayTypeNode).elementType as ts.TypeNode;
        callExpression.arguments.push(typeCalls(typeNode));

        return callExpression;
      }
    case ts.SyntaxKind.TypeReference:
      {
        const typeRef = type as ts.TypeReferenceNode;
        const typeName = typeRef.typeName.getText();
        let callExpression: any;

        if (typeName === 'Array' || typeName === 'array') {
          callExpression = utils.ast.getCallExpression('array');
        } else {
          callExpression = utils.ast.getCallExpression('ref');
          callExpression.arguments.push(utils.ast.getIdentifier(typeName));
        }

        for (const arg of typeRef.typeArguments) {
          callExpression.arguments.push(typeCalls(arg));
        }

        return callExpression;
      }
    case ts.SyntaxKind.TupleType:
      {
        const typeRef = type as ts.TupleTypeNode;
        const callExpression = utils.ast.getCallExpression('tuple');

        for (const arg of typeRef.elementTypes) {
          callExpression.arguments.push(typeCalls(arg));
        }

        return callExpression;
      }
    default:
      throw new Error('Node Type not supported.');
  }
}
