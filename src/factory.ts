import * as ts from 'typescript';

export class Factory {

  private _lib = 't';
  private _namespace = '_';
  private _nullable = true;

  constructor(lib?: string, namespace?: string, strictNullChecks?: boolean) {
    this.lib = lib || this.lib;
    this.namespace = namespace || this.namespace;
    this._nullable = strictNullChecks || this.nullable;
  }

  public typeReflection(node: ts.TypeNode): ts.Expression {
    switch (node.kind) {
      case ts.SyntaxKind.ParenthesizedType:
        return this.typeReflection((node as ts.ParenthesizedTypeNode).type);
      case ts.SyntaxKind.AnyKeyword:
        return this.anyTypeReflection();
      case ts.SyntaxKind.NumberKeyword:
        return this.numberTypeReflection();
      case ts.SyntaxKind.BooleanKeyword:
        return this.booleanTypeReflection();
      case ts.SyntaxKind.StringKeyword:
        return this.stringTypeReflection();
      case ts.SyntaxKind.SymbolKeyword:
        return this.symbolTypeReflection();
      case ts.SyntaxKind.ObjectKeyword:
        return this.objectTypeReflection();
      case ts.SyntaxKind.VoidKeyword:
        return this.voidTypeReflection();
      case ts.SyntaxKind.NullKeyword:
        return this.nullTypeReflection();
      case ts.SyntaxKind.UndefinedKeyword:
        return this.undefinedTypeReflection();
      case ts.SyntaxKind.LiteralType:
        return this.literalTypeReflection(node as ts.LiteralTypeNode);
      case ts.SyntaxKind.ArrayType:
        return this.arrayTypeReflection(node as ts.ArrayTypeNode);
      case ts.SyntaxKind.TupleType:
        return this.tupleTypeReflection(node as ts.TupleTypeNode);
      case ts.SyntaxKind.UnionType:
        return this.unionTypeReflection(node as ts.UnionTypeNode);
      case ts.SyntaxKind.IntersectionType:
        return this.intersectionTypeReflection(node as ts.IntersectionTypeNode);
      case ts.SyntaxKind.ThisType:
        return this.thisTypeReflection();
      case ts.SyntaxKind.TypeReference:
        return this.typeReferenceReflection(node as ts.TypeReferenceNode);
      case ts.SyntaxKind.FunctionType:
      case ts.SyntaxKind.ConstructorType:
        return this.functionTypeReflection(node as ts.FunctionTypeNode | ts.ConstructorTypeNode);
      case ts.SyntaxKind.TypeLiteral:
        return this.typeLiteralReflection(node as ts.TypeLiteralNode);
      case ts.SyntaxKind.TypeParameter: // generics // TODO: implement
      case ts.SyntaxKind.TypePredicate: // function a(pet: Fish | Bird) pet is Fish // TODO: implement
      case ts.SyntaxKind.TypeQuery: // typeof a // TODO: implement
      // type Readonly<T> = {
      //   readonly [P in keyof T]: T[P];
      // }
      case ts.SyntaxKind.MappedType: // TODO: implement
      case ts.SyntaxKind.IndexedAccessType: // TODO: implement
      default:
        throw new Error(`No reflection for syntax kind '${ts.SyntaxKind[node.kind]}' found.`);
    }
  }

  public typeAliasSubstitution(node: ts.TypeAliasDeclaration): ts.Expression {
    return this.propertyAccessCall(this.lib, 'type', [
      ts.createLiteral(node.name),
      this.typeReflection(node.type)
    ]);
  }

  public interfaceSubstitution(node: ts.InterfaceDeclaration): ts.Expression {
    return this.propertyAccessCall(this.lib, 'type', [
      ts.createLiteral(node.name),
      this.nullify(this.libCall('object', this.typeElementsReflection(node.members)))
    ])
  }

  public typeDeclaration(name: string | ts.Identifier | ts.ObjectBindingPattern | ts.ArrayBindingPattern, node: ts.TypeNode): ts.VariableDeclaration {
    return ts.createVariableDeclaration(name, undefined, this.typeReflection(node));
  }

  public typeDefinitionAndAssertion(node: ts.TypeNode, args: ts.Expression | ts.Expression[] = []): ts.CallExpression {
    return this.typeAssertion(this.typeReflection(node), args);
  }

  public typeAssertion(id: string | ts.Expression, args: ts.Expression | ts.Expression[] = []): ts.CallExpression {
    return this.propertyAccessCall(id, 'assert', args);
  }



  public anyTypeReflection(node?: ts.KeywordTypeNode): ts.Expression {
    return this.libCall('any');
  }

  public numberTypeReflection(node?: ts.KeywordTypeNode): ts.Expression {
    return this.nullify(this.libCall('number'));
  }

  public booleanTypeReflection(node?: ts.KeywordTypeNode): ts.Expression {
    return this.nullify(this.libCall('boolean'));
  }

  public stringTypeReflection(node?: ts.KeywordTypeNode): ts.Expression {
    return this.nullify(this.libCall('string'));
  }

  public symbolTypeReflection(node?: ts.KeywordTypeNode): ts.Expression {
    return this.nullify(this.libCall('symbol'));
  }

  public objectTypeReflection(node?: ts.KeywordTypeNode): ts.Expression {
    return this.nullify(this.libCall('object'));
  }

  public voidTypeReflection(node?: ts.KeywordTypeNode): ts.Expression {
    return this.libCall('union', [this.libCall('null'), this.libCall('void')]);
  }

  public nullTypeReflection(node?: ts.KeywordTypeNode): ts.Expression {
    return this.libCall('null');
  }

  public undefinedTypeReflection(node?: ts.KeywordTypeNode): ts.Expression {
    return this.nullify(this.libCall('void'));
  }

  public literalTypeReflection(node: ts.LiteralTypeNode): ts.Expression {
    switch (node.literal.kind) {
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
        return this.booleanLiteralTypeReflection(node);
      case ts.SyntaxKind.StringLiteral:
        return this.stringLiteralTypeReflection(node);
      case ts.SyntaxKind.NumericLiteral:
        return this.numericLiteralTypeReflection(node);
      case ts.SyntaxKind.ComputedPropertyName:
      default:
        throw new Error(`No literal type reflection for syntax kind '${ts.SyntaxKind[node.literal.kind]}' found.`);
    }
  }

  public booleanLiteralTypeReflection(node: ts.LiteralTypeNode): ts.Expression {
    return this.propertyAccessCall(this.lib, 'boolean', node.literal);
  }

  public numericLiteralTypeReflection(node: ts.LiteralTypeNode): ts.Expression {
    return this.propertyAccessCall(this.lib, 'string', node.literal);
  }

  public stringLiteralTypeReflection(node: ts.LiteralTypeNode): ts.Expression {
    return this.propertyAccessCall(this.lib, 'number', node.literal);
  }

  public arrayTypeReflection(node: ts.ArrayTypeNode): ts.Expression {
    return this.nullify(this.libCall('array', this.typeReflection(node.elementType)));
  }

  public tupleTypeReflection(node: ts.TupleTypeNode): ts.Expression {
    return this.nullify(this.libCall('tuple', node.elementTypes.map(n => this.typeReflection(n))));
  }

  public unionTypeReflection(node: ts.UnionTypeNode): ts.Expression {
    return this.nullify(this.libCall('union', node.types.map(n => this.typeReflection(n))));
  }

  public intersectionTypeReflection(node: ts.IntersectionTypeNode): ts.Expression {
    return this.nullify(this.libCall('intersection', node.types.map(n => this.typeReflection(n))));
  }

  public thisTypeReflection(node?: ts.ThisTypeNode): ts.Expression {
    return this.nullify(this.libCall('this', ts.createThis()));
  }

  // TODO: handle enums (annotate like functions?)
  public typeReferenceReflection(node: ts.TypeReferenceNode): ts.Expression {
    let keyword: string = 'array';
    const typeNameText: string = node.typeName.getText();
    const args: ts.Expression[] = !node.typeArguments ? [] : node.typeArguments.map(n => this.typeReflection(n));

    if (typeNameText.toLowerCase() !== 'array') {
      args.unshift(ts.createIdentifier(typeNameText));
      keyword = 'ref';
    }

    return this.nullify(this.libCall(keyword, args));
  }

  public functionTypeReflection(node: ts.FunctionTypeNode | ts.ConstructorTypeNode | ts.CallSignatureDeclaration |  ts.ConstructSignatureDeclaration | ts.MethodSignature): ts.Expression {
    const args: ts.Expression[] = node.parameters.map(param => {
      const parameter: ts.Expression[] = [
        this.declarationNameToLiteralOrExpression(param.name),
        this.typeReflection(param.type)
      ];

      if (param.questionToken) {
        parameter.push(ts.createTrue());
      }

      return this.libCall('param', parameter);
    })

    args.push(this.libCall('return', this.typeReflection(node.type)));

    return this.nullify(this.libCall('function', args));
  }

  public constructorTypeReflection(node: ts.ConstructorTypeNode): ts.Expression {
    return this.functionTypeReflection(node);
  }

  // TODO: handle ComputedPropertyName
  public typeLiteralReflection(node: ts.TypeLiteralNode): ts.Expression {
    return this.nullify(this.libCall('object', this.typeElementsReflection(node.members)));
  }

  public typeElementsReflection(nodes: ts.TypeElement[]) {
    return nodes.map(node => {
      switch (node.kind) {
        case ts.SyntaxKind.IndexSignature:
          return this.indexSignatureReflection(node as ts.IndexSignatureDeclaration);
        case ts.SyntaxKind.PropertySignature:
          return this.propertySignatureReflection(node as ts.PropertySignature);
        case ts.SyntaxKind.CallSignature:
          return this.callSignatureReflection(node as ts.CallSignatureDeclaration);
        case ts.SyntaxKind.ConstructSignature:
          return this.constructSignatureReflection(node as ts.ConstructSignatureDeclaration);
        case ts.SyntaxKind.MethodSignature:
          return this.methodSignatureReflection(node as ts.MethodSignature);
        default:
          throw new Error(`No type element reflection for syntax kind '${ts.SyntaxKind[node.kind]}' found.`);
      }
    });
  }

  public indexSignatureReflection(node: ts.IndexSignatureDeclaration): ts.Expression {
    const name = node.parameters[0].name;

    return this.libCall('indexer', [
      this.declarationNameToLiteralOrExpression(node.parameters[0].name),
      this.typeReflection(node.parameters[0].type),
      this.typeReflection(node.type)
    ]);
  }

  public propertySignatureReflection(node: ts.PropertySignature): ts.Expression {
    return this.libCall('property', [
      this.propertyNameToLiteralOrExpression(node.name),
      this.typeReflection(node.type)
    ]);
  }

  public callSignatureReflection(node: ts.CallSignatureDeclaration | ts.ConstructSignatureDeclaration): ts.Expression {
    return this.libCall('callProperty', this.functionTypeReflection(node));
  }

  public constructSignatureReflection(node: ts.ConstructSignatureDeclaration): ts.Expression {
    return this.callSignatureReflection(node);
  }

  public methodSignatureReflection(node: ts.MethodSignature): ts.Expression {
    return this.libCall('property', [
      this.propertyNameToLiteralOrExpression(node.name),
      this.functionTypeReflection(node)
    ]);
  }

  public propertyNameToLiteralOrExpression(node: ts.PropertyName): ts.Expression | ts.StringLiteral | ts.NumericLiteral {
    // fixes TS compiler error (property kind does not exist on type never) if using ts.SyntaxKind[node.kind] in default clause.
    const kind = node.kind;

    switch (node.kind) {
      case ts.SyntaxKind.Identifier:
        return ts.createLiteral(node);
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NumericLiteral:
        return node;
      case ts.SyntaxKind.ComputedPropertyName:
        return node.expression;
      default:
        throw new Error(`Property name for syntax kind '${ts.SyntaxKind[kind]}' could not be generated.`);
    }
  }

  public declarationNameToLiteralOrExpression(node: ts.DeclarationName): ts.Expression | ts.StringLiteral | ts.NumericLiteral {
    switch (node.kind) {
      case ts.SyntaxKind.Identifier:
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NumericLiteral:
      case ts.SyntaxKind.ComputedPropertyName:
        return this.propertyNameToLiteralOrExpression(node as ts.PropertyName);
      case ts.SyntaxKind.ObjectBindingPattern:
      case ts.SyntaxKind.ArrayBindingPattern:
      default:
        throw new Error(`Declaration name for syntax kind '${ts.SyntaxKind[node.kind]}' could not be generated.`);
    }
  }

  public nullify(reflection: ts.Expression): ts.Expression {
    return !this.nullable ? reflection : this.libCall('nullable', reflection);
  }

  public libCall(prop: string | ts.Identifier, args: ts.Expression | ts.Expression[] = []): ts.CallExpression {
    return this.propertyAccessCall(this.lib, prop, args);
  }

  public propertyAccessCall(id: string | ts.Expression, prop: string | ts.Identifier, args: ts.Expression | ts.Expression[] = []): ts.CallExpression {
    id = typeof id === 'string' ? ts.createIdentifier(id) : id;

    args = Array.isArray(args) ? args : [args];

    return ts.createCall(ts.createPropertyAccess(id, prop), undefined, args);
  }

  get lib(): string {
    return this._lib;
  }

  set lib(lib: string) {
    this._lib = lib;
  }

  get namespace(): string {
    return this._namespace;
  }

  set namespace(namespace: string) {
    this._namespace = namespace;
  }

  get nullable(): boolean {
    return this._nullable;
  }

  set nullable(nullable: boolean) {
    this._nullable = nullable;
  }

}
