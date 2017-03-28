import * as ts from 'typescript';

export class Generator {

  private _lib = 't';
  private _namespace = '_';
  private _strictNullChecks = false;

  constructor(lib?: string, namespace?: string, strictNullChecks?: boolean) {
    this.lib = lib || this.lib;
    this.namespace = namespace || this.namespace;
    this._strictNullChecks = strictNullChecks || this.strictNullChecks;
  }

  public typeDeclaration(name: string | ts.Identifier, type: string | ts.TypeNode): ts.VariableDeclaration {
    return ts.createVariableDeclaration(name, undefined, this.typeDefinition(type));
  }

  public typeDefinitionAndAssertion(type: string | ts.TypeNode, args: ts.Expression | ts.Expression[] = [], types: ts.TypeNode | ts.TypeNode[] = []): ts.CallExpression {
    return this.typeAssertion(this.typeDefinition(type), args, types);
  }

  public typeAssertion(id: string | ts.Expression, args: ts.Expression | ts.Expression[] = [], types: ts.TypeNode | ts.TypeNode[] = []): ts.CallExpression {
    return this.propertyAccessCall(id, 'assert', args, types);
  }

  public parameterAssertion(id: string, typeName: string): ts.CallExpression {
    return ts.createCall(
      ts.createPropertyAccess(
        this.propertyAccessCall(this.lib, 'param', [ts.createLiteral(id), ts.createIdentifier(typeName)]),
        'assert'
      ), undefined, [ts.createIdentifier(id)]
    );
  }

  public returnAssertion(typeName: string, expression: ts.Expression): ts.CallExpression {
    return this.propertyAccessCall(typeName, 'assert', expression);
  }

  public returnDeclaration(type: ts.TypeNode): ts.CallExpression {
    return this.propertyAccessCall(this.lib, 'return', this.typeDefinition(type));
  }

  // public annotationDecorator(): ts.Decorator {
  //   return ts.createDecorator(this.propertyAccessCall(this.lib, 'annotate'));
  // }
  //
  // public propertyType(name: string, type: ts.TypeNode, isStatic = false): ts.CallExpression {
  //   return this.propertyAccessCall(this.lib, isStatic ? 'staticProperty': 'property', this.typeDefinition(type));
  // }
  //
  // public methodType(name: string, params: ts.Expression[] = []): ts.CallExpression {
  //   params.unshift(ts.createLiteral(name));
  //   return this.propertyAccessCall(this.lib, 'method', params);
  // }
  //
  // public parameterType(name: string, type: ts.TypeNode): ts.CallExpression {
  //   return this.propertyAccessCall(this.lib, 'param', [
  //     ts.createLiteral(name),
  //     this.typeDefinition(type)
  //   ]);
  // }
  //
  // public returnType(type: ts.TypeNode): ts.CallExpression {
  //   return this.propertyAccessCall(this.lib, 'return', this.typeDefinition(type));
  // }

  // TODO: typeParameters
  // public classAnnotation1(node: ts.ClassDeclaration): ts.CallExpression {
  //   const expressions: ts.Expression[] = [];
  //
  //   if (node.heritageClauses) {
  //     const extendsIndex = node.heritageClauses.findIndex(element => element.token === ts.SyntaxKind.ExtendsKeyword);
  //
  //     if (extendsIndex !== -1) {
  //       const extendsClause = node.heritageClauses[extendsIndex];
  //
  //       if (extendsClause.types) {
  //         expressions.push(
  //           this.propertyAccessCall(this.lib, 'extends', extendsClause.types[0].expression)
  //         );
  //       }
  //     }
  //   }
  //
  //   for (let member of node.members) {
  //     const properties: ts.Expression[] = [
  //       ts.createLiteral(member.name.getText())
  //     ];
  //
  //     switch (member.kind) {
  //       case ts.SyntaxKind.MethodDeclaration:
  //       case ts.SyntaxKind.SetAccessor:
  //       case ts.SyntaxKind.Constructor:
  //       case ts.SyntaxKind.GetAccessor:
  //         if (member.kind !== ts.SyntaxKind.GetAccessor) {
  //           type HasParameters = ts.MethodDeclaration | ts.SetAccessorDeclaration | ts.ConstructorDeclaration;
  //
  //           (member as HasParameters).parameters.forEach(param => {
  //             const parameters: ts.Expression[] = [
  //               ts.createLiteral(param.name.getText())
  //             ];
  //
  //             if (param.type) {
  //               parameters.push(this.typeDefinition(param.type));
  //             }
  //
  //             properties.push(this.propertyAccessCall(this.lib, 'param', parameters));
  //           });
  //         }
  //
  //         if ((member as ts.GetAccessorDeclaration).type) {
  //           properties.push(
  //             this.propertyAccessCall(this.lib, 'return', this.typeDefinition((member as ts.GetAccessorDeclaration).type))
  //           );
  //         }
  //
  //         expressions.push(
  //           this.propertyAccessCall(
  //             this.lib,
  //             member.modifiers && member.modifiers.findIndex(el => el.kind === ts.SyntaxKind.StaticKeyword) !== -1 ? 'staticMethod' : 'method',
  //             properties
  //           )
  //         );
  //
  //         break;
  //       case ts.SyntaxKind.PropertyDeclaration:
  //         break;
  //       default:
  //       // TODO: throw exception
  //     }
  //   }
  //
  //   return this.propertyAccessCall(this.lib, 'annotate', this.propertyAccessCall(this.lib, 'class', expressions));
  // }

  // TODO: Add ParenthesizedType, LiteralType,...
  //
  //  OK Handle strictNullChecks (nullable)
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
  //  OK ParenthesizedType OK
  // LiteralType
  // UnionType OK
  //
  // TypePredicate (type guards)
  //  OK ThisType OK
  // TypeOperator
  // IndexedAccessType
  // MappedType
  //  OK ConstructorType :new()
  // readonly
  //  OK TypeAliasDeclaration
  //
  // CallSignature (): string

  public nullChecks(expression: ts.CallExpression): ts.CallExpression {
    return this.strictNullChecks ? expression : this.propertyAccessCall(this.lib, 'nullable', expression);
  }

  public typeSubstitution(name: string | ts.Identifier, elements: ts.TypeElement[] | ts.TypeNode): ts.CallExpression {
    name = typeof name === 'string' ? name : name.getText();

    return this.propertyAccessCall(this.lib, 'type', [
      ts.createLiteral(name),
      Array.isArray(elements) ? this.typeElements(elements) : this.typeDefinition(elements)
    ])
  }

  public typeDefinition(type: string | ts.TypeNode, applyNullChecks = true, forClass = false): ts.CallExpression {
    if (!type) {
      return null;
    }

    if (typeof type === 'string') {
      return this.propertyAccessCall(this.lib, type);
    }

    const typeDefinition = this.typeDefinitionBase(type, forClass);

    // TODO: no nullable if any, null included in callexpression

    return applyNullChecks ? this.nullChecks(typeDefinition) : typeDefinition;
  }

  protected typeDefinitionBase(type: ts.TypeNode, forClass = false): ts.CallExpression {
    switch (type.kind) {
      case ts.SyntaxKind.BooleanKeyword:
      case ts.SyntaxKind.NumberKeyword:
      case ts.SyntaxKind.StringKeyword:
      case ts.SyntaxKind.AnyKeyword:
      case ts.SyntaxKind.NullKeyword:
      case ts.SyntaxKind.ObjectKeyword:
        {
          return this.propertyAccessCall(this.lib, type.getText());
        }
      case ts.SyntaxKind.SymbolKeyword:
        {
          return this.propertyAccessCall(this.lib, 'symbol');
        }
      case ts.SyntaxKind.UndefinedKeyword:
        {
          return this.propertyAccessCall(this.lib, 'void');
        }
      case ts.SyntaxKind.VoidKeyword:
        {
          return this.propertyAccessCall(this.lib, 'union', [
            this.propertyAccessCall(this.lib, 'void'),
            this.propertyAccessCall(this.lib, 'null')
          ]);
        }
      case ts.SyntaxKind.ParenthesizedType:
        {
          return this.typeDefinition((type as ts.ParenthesizedTypeNode).type);
        }
      case ts.SyntaxKind.TypeLiteral:
        {
          return this.typeElements((type as ts.TypeLiteralNode).members);
        }
      case ts.SyntaxKind.LiteralType:
        {
          const ltn = type as ts.LiteralTypeNode;

          switch (ltn.literal.kind) {
            case ts.SyntaxKind.TrueKeyword:
              return this.propertyAccessCall(this.lib, 'boolean', ts.createTrue());
            case ts.SyntaxKind.FalseKeyword:
              return this.propertyAccessCall(this.lib, 'boolean', ts.createFalse());
            case ts.SyntaxKind.StringLiteral:
              const str = ltn.literal.getText();
              return this.propertyAccessCall(this.lib, 'string', ts.createLiteral(str.substring(1, str.length - 1)));
            case ts.SyntaxKind.NumericLiteral:
              return this.propertyAccessCall(this.lib, 'number', ts.createNumericLiteral(ltn.literal.getText()));
            // TODO: case ts.SyntaxKind.ComputedPropertyName:
            default:
              // TODO: Throw exception here?
              {
                const str = ltn.literal.getText();
                return this.propertyAccessCall(this.lib, 'ref', ts.createIdentifier(str.substring(1, str.length - 1)));
              }
          }
        }
      case ts.SyntaxKind.ThisType:
        {
          return this.propertyAccessCall(this.lib, 'this', ts.createThis());
        }
      case ts.SyntaxKind.UnionType:
        {
          let args: ts.CallExpression[] = (type as ts.UnionTypeNode).types.map(typeNode => {
            return this.typeDefinition(typeNode);
          });

          return this.propertyAccessCall(this.lib, 'union', args);
        }
      case ts.SyntaxKind.IntersectionType:
        {
          let args: ts.CallExpression[] = (type as ts.IntersectionTypeNode).types.map(typeNode => {
            return this.typeDefinition(typeNode);
          });

          return this.propertyAccessCall(this.lib, 'intersection', args);
        }
      case ts.SyntaxKind.ConstructorType:
      case ts.SyntaxKind.FunctionType:
        {
          const expressions: ts.Expression[] = (type as ts.FunctionTypeNode).parameters.map(param => {
            const parameter: ts.Expression[] = [
              ts.createLiteral(param.name.getText()),
              this.typeDefinition(param.type)
            ];

            if (param.questionToken) {
              parameter.push(ts.createTrue());
            }

            return this.propertyAccessCall(this.lib, 'param', parameter);
          });

          expressions.push(
            this.propertyAccessCall(this.lib, 'return', this.typeDefinition((type as ts.FunctionTypeNode).type))
          );

          return this.propertyAccessCall(this.lib, forClass ? 'method' : 'function', expressions);
        }
      case ts.SyntaxKind.ArrayType:
        {
          const typeNode = (type as ts.ArrayTypeNode).elementType as ts.TypeNode;
          const callExpression = this.propertyAccessCall(this.lib, 'array', this.typeDefinition(typeNode));

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
              args.push(this.typeDefinition(arg));
            }
          }

          if (typeName === 'Array' || typeName === 'array') {
            callExpression = this.propertyAccessCall(this.lib, 'array', args);
          } else {
            callExpression = this.propertyAccessCall(this.lib, 'ref', ts.createIdentifier(typeName));
          }

          return callExpression;
        }
      case ts.SyntaxKind.TupleType:
        {
          const typeRef = type as ts.TupleTypeNode;
          const args: ts.CallExpression[] = [];

          for (const arg of typeRef.elementTypes) {
            args.push(this.typeDefinition(arg));
          }

          return this.propertyAccessCall(this.lib, 'tuple', args);
        }
      default:
        {
          // TODO: Throw exception, type cannot be classified.
          return this.propertyAccessCall(this.lib, 'unknown');
        }
    }
  }

  public typeElements(elements: ts.TypeElement[]): ts.CallExpression {
    const expressions: ts.Expression[] = [];

    for (let member of elements) {
      switch (member.kind) {
        case ts.SyntaxKind.IndexSignature:
          {
            const m = member as ts.IndexSignatureDeclaration;
            expressions.push(
              this.propertyAccessCall(this.lib, 'indexer', [
                ts.createLiteral(m.parameters[0].name.getText()),
                this.typeDefinition(m.parameters[0].type),
                this.typeDefinition(m.type)
              ])
            );

            break;
          }
        case ts.SyntaxKind.PropertySignature:
          {
            const m = member as ts.PropertySignature;
            const typeDef: ts.Expression[] = [
              ts.createLiteral(m.name.getText()),
              this.typeDefinition(m.type)
            ];

            if (m.questionToken) {
              typeDef.push(ts.createTrue());
            }

            expressions.push(this.propertyAccessCall(
              this.lib, 'property', typeDef
            ));

            break;
          }
        case ts.SyntaxKind.ConstructSignature:
          {

          }
        case ts.SyntaxKind.CallSignature:
          {

          }
        case ts.SyntaxKind.MethodSignature:
          {

          }
        default:
        // TODO: throw exception?
      }
    }

    return this.propertyAccessCall(this.lib, 'object', expressions);
  }

  public propertyAccessCall(id: string | ts.Expression, prop: string | ts.Identifier, args: ts.Expression | ts.Expression[] = [], types: ts.TypeNode | ts.TypeNode[] = []): ts.CallExpression {
    id = typeof id === 'string' ? ts.createIdentifier(id) : id;
    args = Array.isArray(args) ? args : [args];
    types = Array.isArray(types) ? types : [types];

    return ts.createCall(ts.createPropertyAccess(id, prop), types, args);
  }

  set lib(lib: string) {
    this._lib = lib;
  }

  public setLib(lib: string): Generator {
    this.lib = lib;
    return this;
  }

  get lib(): string {
    return this._lib;
  }

  public getLib(): string {
    return this.lib;
  }

  set namespace(namespace: string) {
    this._namespace = namespace;
  }

  public setNamespace(namespace: string): Generator {
    this.namespace = namespace;
    return this;
  }

  get namespace(): string {
    return this.namespace;
  }

  public getNamespace(): string {
    return this.namespace;
  }

  set strictNullChecks(strictNullChecks: boolean) {
    this._strictNullChecks = strictNullChecks;
  }

  public setStrictNullChecks(strictNullChecks: boolean): Generator {
    this.strictNullChecks = strictNullChecks;
    return this;
  }

  get strictNullChecks(): boolean {
    return this._strictNullChecks;
  }

  public getStrictNullChecks(): boolean {
    return this.strictNullChecks;
  }

}
