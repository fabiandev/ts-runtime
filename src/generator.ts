import * as ts from 'typescript';

let LIB = 't';

export function setLib(lib: string): void {
  LIB = lib;
}

export function getLib(): string {
  return LIB;
}

export function typeDeclaration(name: string | ts.Identifier, type: string | ts.TypeNode): ts.VariableDeclaration {
  return ts.createVariableDeclaration(name, undefined, typeDefinition(type));
}

export function typeDefinitionAndAssertion(type: string | ts.TypeNode, args: ts.Expression | ts.Expression[] = [], types: ts.TypeNode | ts.TypeNode[] = []): ts.CallExpression {
  return typeAssertion(typeDefinition(type), args, types);
}

export function typeAssertion(id: string | ts.Expression, args: ts.Expression | ts.Expression[] = [], types: ts.TypeNode | ts.TypeNode[] = []): ts.CallExpression {
  return propertyAccessCall(id, 'assert', args, types);
}

// TODO: Add ParenthesizedType, LiteralType,...
//
// Handle strictNullChecks
// Generics
// Extends
//
// Array, Object and Function Destructuring
// Spread operator
// Default values
// Remove types in .tsr
//
// VoidKeyword (only undefined or null for variables) OK
// NeverKeyword
// EnumKeyword
// ObjectKeyword
//
// ParenthesizedType OK
// LiteralType
// UnionType OK
//
// TypePredicate (type guards)
// ThisType OK
// TypeOperator
// IndexedAccessType
// MappedType
// readonly
// TypeAliasDeclaration
export function typeDefinition(type: string | ts.TypeNode): ts.CallExpression {
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
    case ts.SyntaxKind.NullKeyword:
    case ts.SyntaxKind.ObjectKeyword:
      {
        return propertyAccessCall(LIB, type.getText());
      }
    case ts.SyntaxKind.SymbolKeyword:
      {
        return propertyAccessCall(LIB, 'ref', ts.createIdentifier('Symbol'));
      }
    case ts.SyntaxKind.UndefinedKeyword:
      {
        return propertyAccessCall(LIB, 'void');
      }
    case ts.SyntaxKind.VoidKeyword:
      {
        return propertyAccessCall(LIB, 'union', [
          propertyAccessCall(LIB, 'void'),
          propertyAccessCall(LIB, 'null')
        ]);
      }
    case ts.SyntaxKind.ParenthesizedType:
      {
        return typeDefinition((type as ts.ParenthesizedTypeNode).type);
      }
    case ts.SyntaxKind.TypeLiteral:
      {
        // E.g. let a: { x: number; } = {}; // has PropertySignature
      }
    case ts.SyntaxKind.LiteralType:
      {
        const ltn = type as ts.LiteralTypeNode;

        switch (ltn.literal.kind)  {
          case ts.SyntaxKind.TrueKeyword:
            return propertyAccessCall(LIB, 'boolean', ts.createTrue());
          case ts.SyntaxKind.FalseKeyword:
            return propertyAccessCall(LIB, 'boolean', ts.createFalse());
          case ts.SyntaxKind.StringLiteral:
            const str = ltn.literal.getText();
            return propertyAccessCall(LIB, 'string', ts.createLiteral(str.substring(1, str.length - 1)));
          case ts.SyntaxKind.NumericLiteral:
            return propertyAccessCall(LIB, 'number', ts.createNumericLiteral(ltn.literal.getText()));
          default:
            // TODO: Throw exception here?
            {
              const str = ltn.literal.getText();
              return propertyAccessCall(LIB, 'ref', ts.createIdentifier(str.substring(1, str.length - 1)));
            }
        }
      }
    case ts.SyntaxKind.ThisType:
      {
        return propertyAccessCall(LIB, 'this', ts.createThis());
      }
    case ts.SyntaxKind.UnionType:
      {
        let args: ts.CallExpression[] = (type as ts.UnionTypeNode).types.map(typeNode => {
          return typeDefinition(typeNode);
        });

        return propertyAccessCall(LIB, 'union', args);
      }
    case ts.SyntaxKind.ArrayType:
      {
        const typeNode = (type as ts.ArrayTypeNode).elementType as ts.TypeNode;
        const callExpression = propertyAccessCall(LIB, 'array', typeDefinition(typeNode));

        return callExpression;
      }
    case ts.SyntaxKind.TypeReference:
      {
        const typeRef = type as ts.TypeReferenceNode;
        const typeName = typeRef.typeName.getText();
        const args: ts.CallExpression[] = [];
        let callExpression: ts.CallExpression;

        if (typeRef.typeArguments) {
          for (let arg of typeRef.typeArguments) {
            args.push(typeDefinition(arg));
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
          args.push(typeDefinition(arg));
        }

        return propertyAccessCall(LIB, 'tuple', args);
      }
    default:
      {
        // TODO: Throw exception, type cannot be classified.
        return propertyAccessCall(LIB, 'unknown');
      }
  }
}

export function propertyAccessCall(id: string | ts.Expression, prop: string | ts.Identifier, args: ts.Expression | ts.Expression[] = [], types: ts.TypeNode | ts.TypeNode[] = []): ts.CallExpression {
  id = typeof id === 'string' ? ts.createIdentifier(id) : id;
  args = Array.isArray(args) ? args : [args];
  types = Array.isArray(types) ? types : [types];

  return ts.createCall(ts.createPropertyAccess(id, prop), types, args);
}
