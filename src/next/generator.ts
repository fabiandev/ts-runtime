import * as ts from 'typescript';

export const LIB = 't';

export function typeDefinition(name: string | ts.Identifier, type: string | ts.TypeNode): ts.VariableDeclaration {
  return ts.createVariableDeclaration(name, undefined, typeAssertion(type));
}

export function typeAssertion(type: ts.TypeNode | string): ts.CallExpression {
  if (!type) {
    return null;
  }

  if (typeof type === 'string') {
    return propertyAccessCall(LIB, type as string);
  }

  type = type as ts.TypeNode;

  switch (type.kind) {
    case ts.SyntaxKind.BooleanKeyword:
    case ts.SyntaxKind.NumberKeyword:
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.AnyKeyword:
      {
        return propertyAccessCall(LIB, type.getText());
      }
    case ts.SyntaxKind.ArrayType:
      {
        const typeNode = (type as ts.ArrayTypeNode).elementType as ts.TypeNode;
        const callExpression = propertyAccessCall(LIB, 'array', typeAssertion(typeNode));
        return callExpression;
      }
    case ts.SyntaxKind.TypeReference:
      {
        const typeRef = type as ts.TypeReferenceNode;
        const typeName = typeRef.typeName.getText();
        const args: ts.CallExpression[] = [];
        let callExpression: ts.CallExpression;

        if (typeRef.typeArguments) {
          for (const arg of typeRef.typeArguments) {
            args.push(typeAssertion(arg));
          }
        }

        if (typeName === 'Array' || typeName === 'array') {
          callExpression = propertyAccessCall(LIB, 'array', args);
        } else {
          callExpression = propertyAccessCall(LIB, 'ref', ts.createIdentifier(typeName));
        }

        return callExpression;
      }
    case ts.SyntaxKind.TupleType:
      {
        const typeRef = type as ts.TupleTypeNode;
        const args: ts.CallExpression[] = [];

        for (const arg of typeRef.elementTypes) {
          args.push(typeAssertion(arg));
        }

        return propertyAccessCall(LIB, 'tuple', args);
      }
    default:
      {
        return propertyAccessCall(LIB, 'any');
      }
  }
}

export function propertyAccessCall(id: string | ts.Expression, prop: string | ts.Identifier, args: ts.Expression | ts.Expression[] = [], types: ts.TypeNode | ts.TypeNode[] = []): ts.CallExpression {
  id = typeof id === 'string' ? ts.createIdentifier(id) : id;
  args = Array.isArray(args) ? args : [args];
  types = Array.isArray(types) ? types : [types];

  return ts.createCall(ts.createPropertyAccess(id, prop), types, args);
}
