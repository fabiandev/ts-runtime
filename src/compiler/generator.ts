import * as ts from 'typescript/built/local/typescript';

export function createTypeDefinition(type: ts.TypeNode, name: string): ts.VariableDeclaration {
  return ts.factory.createVariableDeclaration(
    name,
    undefined,
    createTypeCalls(type),
  );
}

export function createTypeCalls(type: ts.TypeNode): ts.CallExpression {
  if (!type) {
    return null;
  }

  switch (type.kind) {
    case ts.SyntaxKind.BooleanKeyword:
    case ts.SyntaxKind.NumberKeyword:
    case ts.SyntaxKind.StringKeyword:
      {
        return createTypeCall('t', type.getText());
      }
    case ts.SyntaxKind.ArrayType:
      {
        const typeNode = (type as ts.ArrayTypeNode).elementType as ts.TypeNode;
        const callExpression = createTypeCall('t', 'array', [createTypeCalls(typeNode)]);
        return callExpression;
      }
    case ts.SyntaxKind.TypeReference:
      {
        const typeRef = type as ts.TypeReferenceNode;
        const typeName = typeRef.typeName.getText();
        let callExpression: ts.CallExpression;

        const args: ts.CallExpression[] = [];

        if (typeRef.typeArguments) {
          for (const arg of typeRef.typeArguments) {
            args.push(createTypeCalls(arg));
          }
        }

        if (typeName === 'Array' || typeName === 'array') {
          callExpression = createTypeCall('t', 'array', args);
        } else {
          callExpression = createTypeCall('t', 'ref', [ts.factory.createIdentifier(typeName)]);
        }

        return callExpression;
      }
    case ts.SyntaxKind.TupleType:
      {
        const typeRef = type as ts.TupleTypeNode;
        const args: ts.CallExpression[] = [];

        for (const arg of typeRef.elementTypes) {
          args.push(createTypeCalls(arg));
        }

        return createTypeCall('t', 'tuple', args);
      }
    default:
      {
        return createTypeCall('t', 'any');
      }
  }
}

export function createTypeCall(id: string, prop: string, args: ts.Expression[] = [], types: ts.TypeNode[] = []): ts.CallExpression {
  return ts.factory.createCall(ts.factory.createPropertyAccess(ts.factory.createIdentifier(id), prop), types, args);
}
