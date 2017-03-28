import * as ts from 'typescript';

export class Factory {

  private _lib = 't';
  private _namespace = '_';
  private _nullable = true;

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
      case ts.SyntaxKind.LiteralType: // TODO: implement
        break;
      case ts.SyntaxKind.ArrayType:
        return this.arrayTypeReflection(node as ts.ArrayTypeNode);
      case ts.SyntaxKind.TupleType:
        return this.tupleTypeReflection(node as ts.TupleTypeNode);
      case ts.SyntaxKind.ConstructorType: // TODO: implement
        break;
      case ts.SyntaxKind.FunctionType: // TODO: implement
        break;
      case ts.SyntaxKind.UnionType:
        return this.unionTypeReflection(node as ts.UnionTypeNode);
      case ts.SyntaxKind.IntersectionType:
        return this.intersectionTypeReflection(node as ts.IntersectionTypeNode);
      case ts.SyntaxKind.TypeReference: // TODO: handle enums
        break;
      case ts.SyntaxKind.ThisType:
        return this.thisTypeReflection();
      case ts.SyntaxKind.TypeLiteral: // TODO: implement
        break;
      case ts.SyntaxKind.TypeParameter: // generics // TODO: implement
        break;
      case ts.SyntaxKind.TypePredicate: // function a(pet: Fish | Bird) pet is Fish // TODO: implement
        break;
      case ts.SyntaxKind.TypeQuery: // typeof a // TODO: implement
        break;
      // type Readonly<T> = {
      //   readonly [P in keyof T]: T[P];
      // }
      case ts.SyntaxKind.MappedType: // TODO: implement
        break;
      case ts.SyntaxKind.IndexedAccessType: // TODO: implement
        break;
      default:
        // TODO: throw exception (bus error)
        throw new Error(`No reflection for syntax kind '${ts.SyntaxKind[node.kind]}' found.`);
    }
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

  public literalTypeReflection() {

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

  public typeLiteralReflection() {
    // ts.SyntaxKind.IndexSignature:
    // ts.SyntaxKind.PropertySignature
    // ts.SyntaxKind.ConstructSignature
    // ts.SyntaxKind.CallSignature
    // ts.SyntaxKind.MethodSignature
    // ts.SyntaxKind.ComputedPropertyName // [prop]: string
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

}
