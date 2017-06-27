import * as ts from 'typescript';
import * as util from './util';
import * as bus from './bus';
import { ProgramError } from './errors';
import { Options } from './options';
import { Scanner, TypeInfo } from './scanner';
import { MutationContext } from './context';

export type FunctionDeclarationLikeNode = ts.ArrowFunction | ts.FunctionDeclaration |
  ts.FunctionExpression | ts.ArrowFunction | ts.ConstructorDeclaration | ts.MethodDeclaration |
  ts.SetAccessorDeclaration | ts.GetAccessorDeclaration;

export type FunctionLikeNode = ts.FunctionExpression | ts.ArrowFunction | ts.FunctionDeclaration |
  ts.FunctionTypeNode | ts.ConstructorTypeNode | ts.ConstructorDeclaration | ts.CallSignatureDeclaration |
  ts.ConstructSignatureDeclaration | ts.MethodSignature | ts.MethodDeclaration | ts.SetAccessorDeclaration |
  ts.GetAccessorDeclaration;

export type MethodLikeNode = ts.ConstructorTypeNode | ts.ConstructorDeclaration | ts.CallSignatureDeclaration |
  ts.ConstructSignatureDeclaration | ts.MethodSignature | ts.MethodDeclaration | ts.SetAccessorDeclaration |
  ts.GetAccessorDeclaration;

export type ElementLikeNode = ts.TypeElement | ts.ClassElement;

export class Factory {

  private _state: Map<FactoryState, number> = new Map();
  private _strictNullChecks: boolean;
  private _namespace: string = '';
  private _lib: string = 't';
  private _load: string = 'ts-runtime/lib';

  constructor(private _context: MutationContext, options: Options, library?: string) {
    this._strictNullChecks = !!options.compilerOptions.strictNullChecks;
    this._namespace = options.libNamespace || this._namespace;
    this._lib = options.libIdentifier || this._lib;
    this._load = library || this._load;

    return new Proxy(this, {
      get: this.proxy.bind(this)
    });
  }

  private proxy(target: Factory, property: string, receiver: any) {
    const destination = (target as any)[property];

    if (typeof destination !== 'function') {
      return destination;
    }

    const states = FactoryState as any as { [index: string]: number };
    const stateName = property.charAt(0).toUpperCase() + property.slice(1);

    return (...args: any[]) => {
      const state = states[stateName];

      this.addState(state);

      let result = destination.bind(receiver)(...args);

      if (this.match(FactoryRule.Nullable, state)) {
        result = this.nostrict(result);
      }

      this.removeState(state);

      return result;
    };
  }

  public typeReflection(node: ts.TypeNode): ts.Expression {
    if (!node) {
      return this.anyTypeReflection();
    }

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
      case ts.SyntaxKind.NeverKeyword:
        return this.voidTypeReflection();
      case ts.SyntaxKind.NullKeyword:
        return this.nullTypeReflection();
      case ts.SyntaxKind.UndefinedKeyword:
        return this.undefinedTypeReflection();
      case ts.SyntaxKind.ThisType:
        return this.thisTypeReflection();
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
      case ts.SyntaxKind.TypeReference:
        return this.typeReferenceReflection(node as ts.TypeReferenceNode);
      case ts.SyntaxKind.FunctionType:
        return this.functionTypeReflection(node as ts.FunctionTypeNode);
      case ts.SyntaxKind.ConstructorType:
        return this.constructorTypeReflection(node as ts.ConstructorTypeNode);
      case ts.SyntaxKind.TypeQuery:
        return this.typeQueryReflection(node as ts.TypeQueryNode);
      case ts.SyntaxKind.TypeLiteral:
        return this.typeLiteralReflection(node as ts.TypeLiteralNode);
      // case ts.SyntaxKind.TypeParameter:
      case ts.SyntaxKind.TypePredicate:
        return this.booleanTypeReflection();
      case ts.SyntaxKind.ExpressionWithTypeArguments:
        return this.expressionWithTypeArgumentsReflection(node as ts.ExpressionWithTypeArguments);
      case ts.SyntaxKind.MappedType:
        // type Readonly<T> = {
        //   readonly [P in keyof T]: T[P];
        // }
        bus.emit(bus.events.WARN, 'Mapped types are not yet supported.');

        if (this.context.options.log) {
          console.warn('Mapped types are not yet supported.')
        }

        return this.anyTypeReflection();
      case ts.SyntaxKind.IndexedAccessType:
        // function getProperty<T, K extends keyof T>(o: T, name: K): T[K] {
        //     return o[name]; // o[name] is of type T[K]
        // }
        bus.emit(bus.events.WARN, 'Indexed acces types are not yet supported.');

        if (this.context.options.log) {
          console.warn('Indexed acces types are not yet supported.')
        }
        return this.anyTypeReflection();
      case ts.SyntaxKind.TypeOperator:
        // let a: keyof MyClass;
        bus.emit(bus.events.WARN, 'Type operators are not yet supported.');

        if (this.context.options.log) {
          console.warn('Type operators are not yet supported.')
        }

        return this.anyTypeReflection();
      default:
        throw new ProgramError(`No reflection for syntax kind '${ts.SyntaxKind[node.kind]}' found.`);
    }
  }

  public typeDeclaration(name: string | ts.Identifier | ts.ObjectBindingPattern | ts.ArrayBindingPattern, node: ts.TypeNode): ts.VariableDeclaration {
    return ts.createVariableDeclaration(name, undefined, this.typeReflection(node));
  }

  public typeAssertion(id: string | ts.Expression, args: ts.Expression | ts.Expression[] = []): ts.CallExpression {
    return this.propertyAccessCall(id, 'assert', args);
  }

  public typeReflectionAndAssertion(node: ts.TypeNode, args: ts.Expression | ts.Expression[] = []): ts.CallExpression {
    return this.typeAssertion(this.typeReflection(node), args);
  }

  public anyTypeReflection(): ts.CallExpression {
    return this.libCall('any');
  }

  public numberTypeReflection(): ts.CallExpression {
    return this.libCall('number');
  }

  public booleanTypeReflection(): ts.CallExpression {
    return this.libCall('boolean');
  }

  public stringTypeReflection(): ts.CallExpression {
    return this.libCall('string');
  }

  public symbolTypeReflection(): ts.CallExpression {
    return this.libCall('symbol');
  }

  public objectTypeReflection(): ts.CallExpression {
    return this.libCall('object');
  }

  public voidTypeReflection(): ts.CallExpression {
    return this.libCall('void');
  }

  public nullTypeReflection(): ts.CallExpression {
    return this.libCall('null');
  }

  public undefinedTypeReflection(): ts.CallExpression {
    return this.libCall('undef');
  }

  public thisTypeReflection(): ts.CallExpression {
    return this.libCall('this', ts.createThis());
  }

  public literalTypeReflection(node: ts.LiteralTypeNode): ts.CallExpression {
    switch (node.literal.kind) {
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
        return this.booleanLiteralTypeReflection(node.literal as ts.BooleanLiteral);
      case ts.SyntaxKind.StringLiteral:
        return this.stringLiteralTypeReflection(node.literal as ts.StringLiteral);
      case ts.SyntaxKind.NumericLiteral:
        return this.numericLiteralTypeReflection(node.literal as ts.NumericLiteral);
      case ts.SyntaxKind.ComputedPropertyName:
      default:
        throw new Error(`No literal type reflection for syntax kind '${ts.SyntaxKind[node.literal.kind]}' found.`);
    }
  }

  public booleanLiteralTypeReflection(node: ts.BooleanLiteral): ts.CallExpression {
    return this.libCall('boolean', ts.createLiteral(
      node.kind === ts.SyntaxKind.TrueKeyword ? true : false
    ));
  }

  public numericLiteralTypeReflection(node: ts.NumericLiteral): ts.CallExpression {
    return this.libCall('number', ts.createNumericLiteral(node.text));
  }

  public stringLiteralTypeReflection(node: ts.StringLiteral): ts.CallExpression {
    return this.libCall('string', ts.createLiteral(node.text));
  }

  public arrayTypeReflection(node: ts.ArrayTypeNode): ts.CallExpression {
    return this.libCall('array', this.typeReflection(node.elementType));
  }

  public tupleTypeReflection(node: ts.TupleTypeNode): ts.CallExpression {
    return this.libCall('tuple', node.elementTypes.map(n => this.typeReflection(n)));
  }

  public unionTypeReflection(node: ts.UnionTypeNode): ts.CallExpression {
    return this.libCall('union', node.types.map(n => this.typeReflection(n)));
  }

  public intersectionTypeReflection(node: ts.IntersectionTypeNode): ts.CallExpression {
    return this.libCall('intersection', node.types.map(n => this.typeReflection(n)));
  }

  public typeReferenceReflection(node: ts.TypeReferenceNode): ts.Expression {
    const typeNameText: string = util.getEntityNameText(node.typeName);
    const isArray = typeNameText.toLowerCase() === 'array';
    const typeInfo = this.scanner.getTypeInfo(node);
    const TSR_DECLARATION = !!typeInfo && typeInfo.TSR_DECLARATION;

    let args: ts.Expression[] = [];

    if (util.hasNonEmptyArrayProperty(node, 'typeArguments')) {
      node.typeArguments.forEach(typeArgument => {
        args.push(this.typeReflection(typeArgument))
      });
    }

    if (isArray) {
      return this.libCall('array', args);
    }

    const isTypeParameter = util.isTypeParameter(node);
    const flowInto = isTypeParameter && !this.rule(FactoryRule.NoFlowInto);
    const parentClass = !TSR_DECLARATION && isTypeParameter && util.isTypeParameterOfClass(node);
    const isClassTypeParameter = !!parentClass;
    const asLiteral = !isTypeParameter && TSR_DECLARATION;

    let result: ts.Expression;
    let identifier: ts.Expression;
    let keyword = isTypeParameter ? null : 'ref';

    if (flowInto) {
      keyword = 'flowInto'
    }

    if (isClassTypeParameter && !this.rule(FactoryRule.NoClassTypeParameterReflection)) {
      result = ts.createPropertyAccess(
        ts.createElementAccess(
          ts.createThis(),
          ts.createIdentifier(
            this.context.getTypeSymbolDeclarationName(parentClass.name.text)
          )
        ),
        typeNameText
      );

      return !keyword ? result : this.libCall(keyword, result);
    }

    const isSelfReference = this.context.isSelfReference(node);
    const isDeclared = this.context.isDeclared(node.typeName);
    const wasDeclared = this.context.wasDeclared(node.typeName);

    if (typeInfo && typeInfo.symbol) {
      if (util.hasFlag(typeInfo.symbol, ts.SymbolFlags.RegularEnum) || util.hasFlag(typeInfo.symbol, ts.SymbolFlags.ConstEnum)) {
        keyword = asLiteral ? 'ref' : 'enumRef';
      } else if (util.hasFlag(typeInfo.symbol, ts.SymbolFlags.EnumMember)) {
        keyword = asLiteral ? 'ref' : 'enumMember';
      }
    }

    if (asLiteral && !isSelfReference) {
      let sf = typeInfo.declarations[0].getSourceFile().fileName;
      let hash = util.getHash(sf);
      let name = this.context.checker.getFullyQualifiedName(typeInfo.symbol);
      name = name || typeNameText;
      name = `${name}.${hash}`;

      identifier = ts.createLiteral(name);
    } else {
      identifier = ts.createIdentifier(typeNameText);
    }

    if (!wasDeclared && isDeclared && !isSelfReference && !asLiteral) {
      identifier = this.tdz(identifier as ts.Identifier);
    }

    args.unshift(identifier);

    return !keyword ? args[0] : this.libCall(keyword, args);
  }

  public functionTypeReflection(node: ts.FunctionTypeNode): ts.CallExpression {
    return this.functionReflection(node);
  }

  public constructorTypeReflection(node: ts.ConstructorTypeNode): ts.CallExpression {
    return this.methodReflection(node);
  }

  public typeQueryReflection(node: ts.TypeQueryNode): ts.CallExpression {
    return this.libCall('typeOf', ts.createIdentifier(util.getEntityNameText(node.exprName)));
  }

  public typeLiteralReflection(node: ts.TypeLiteralNode): ts.CallExpression {
    return this.asObject(this.elementsReflection(util.asArray(node.members)))
  }

  public expressionWithTypeArgumentsReflection(node: ts.ExpressionWithTypeArguments): ts.CallExpression {
    if (node.expression.kind !== ts.SyntaxKind.PropertyAccessExpression && node.expression.kind !== ts.SyntaxKind.Identifier) {
      throw new ProgramError('An expression with type argument\’s left hand side expression must be a property access expression or an identifier.')
    }

    const identifier: ts.Identifier = node.expression.kind !== ts.SyntaxKind.Identifier ?
      util.getIdentifierOfPropertyAccessExpressionOrFail(node.expression as ts.PropertyAccessExpression) :
      node.expression as ts.Identifier;

    const wasDeclared = this.context.wasDeclared(identifier);
    const isDeclared = this.context.isDeclared(identifier);
    const typeInfo = this.scanner.getTypeInfo(node);
    const asLiteral = typeInfo && typeInfo.TSR_DECLARATION;
    const typeNameText = ts.isIdentifier(node.expression) ?
      node.expression.text :
      util.getPropertyAccessExpressionTextOrFail(node.expression as ts.PropertyAccessExpression);

    let keyword = 'ref';

    if (typeInfo && typeInfo.symbol) {
      if (util.hasFlag(typeInfo.symbol, ts.SymbolFlags.RegularEnum) || util.hasFlag(typeInfo.symbol, ts.SymbolFlags.ConstEnum)) {
        keyword = asLiteral ? 'ref' : 'typeOf';;
      } else if (util.hasFlag(typeInfo.symbol, ts.SymbolFlags.EnumMember)) {
        keyword = asLiteral ? 'ref' : 'number';
      }
    }

    const args: ts.Expression[] = [];
    let id: ts.Expression;

    if (asLiteral) {
      let fileName = typeInfo.declarations[0].getSourceFile().fileName;
      let name = this.context.checker.getFullyQualifiedName(typeInfo.symbol);
      id = ts.createLiteral(util.getHashedDeclarationName(name, fileName));
    } else {
      id = ts.createIdentifier(typeNameText);
    }

    if (!asLiteral && !wasDeclared && isDeclared) {
      id = this.tdz(id as ts.Identifier);
    }

    args.push(id);
    args.push(...(node.typeArguments || [] as ts.TypeNode[]).map(a => this.typeReflection(a)));

    return this.libCall(keyword, args);
  }

  public typeAliasReflection(node: ts.TypeAliasDeclaration, name?: string): ts.Expression {
    const typeNameText = util.getEntityNameText(node.name);
    const hasSelfReference = this.context.hasSelfReference(node);
    const hasTypeParameters = util.hasNonEmptyArrayProperty(node, 'typeParameters');

    const reflection = this.typeReflection(node.type);

    let result = reflection;

    if (hasTypeParameters) {
      const typeParameterDeclarations = node.typeParameters.map(typeParameter => {
        return this.typeParameterDeclaration(typeParameter, typeNameText);
      }, true);

      result = this.selfReference(
        typeNameText,
        ts.createBlock(
          [...typeParameterDeclarations, ts.createReturn(result)],
          true
        )
      );
    } else if (hasSelfReference) {
      return this.selfReference(typeNameText, result);
    }

    return this.asType(name || typeNameText, result);
  }

  public typeAliasSubstitution(node: ts.TypeAliasDeclaration): ts.VariableStatement {
    return ts.createVariableStatement(
      node.modifiers,
      ts.createVariableDeclarationList(
        [
          ts.createVariableDeclaration(
            node.name,
            undefined,
            this.typeAliasReflection(node)
          )
        ],
        ts.NodeFlags.Const
      )
    );
  }

  public interfaceReflection(node: ts.InterfaceDeclaration, name?: string): ts.Expression {
    const typeNameText = util.getEntityNameText(node.name);
    const extendsClause = util.getExtendsClause(node);

    const hasSelfReference = this.context.hasSelfReference(node);
    const hasTypeParameters = util.hasNonEmptyArrayProperty(node, 'typeParameters');
    const hasExtender = util.hasNonEmptyArrayProperty(extendsClause, 'types');

    const members = this.context.getMembers(node);

    const elementsReflection = this.elementsReflection(members);
    const reflection = this.asObject(elementsReflection);

    let result: ts.Expression = reflection;

    if (hasExtender) {
      const intersections = extendsClause.types.map(expressionWithTypeArguments => {
        return this.typeReflection(expressionWithTypeArguments);
      });

      result = this.intersect([...intersections, result])
    }

    if (hasTypeParameters) {
      const typeParameterDeclarations = node.typeParameters.map(typeParameter => {
        return this.typeParameterDeclaration(typeParameter, typeNameText);
      }, true);

      result = this.selfReference(
        typeNameText,
        ts.createBlock(
          [...typeParameterDeclarations, ts.createReturn(result)],
          true
        )
      );
    } else if (hasSelfReference) {
      result = this.selfReference(typeNameText, result);
    }

    return this.asType(name || typeNameText, result);
  }

  public interfaceSubstitution(node: ts.InterfaceDeclaration): ts.Statement {
    const typeNameText = util.getEntityNameText(node.name);
    const interfaceReflection = this.interfaceReflection(node);

    return ts.createVariableStatement(
      node.modifiers,
      ts.createVariableDeclarationList(
        [
          ts.createVariableDeclaration(
            typeNameText,
            undefined,
            interfaceReflection
          )
        ],
        ts.NodeFlags.Const
      )
    );
  }

  public classReflection(node: ts.ClassDeclaration, name?: string): ts.Expression {
    const typeNameText = util.getEntityNameText(node.name);
    const extendsClause = util.getExtendsClause(node);
    const implementsClause = util.getImplementsClause(node);

    const members = this.context.getMembers(node);

    for (let member of node.members || []) {
      if (util.isStatic(member)) {
        members.push(member);
      }
    }

    const hasSelfReference = this.context.hasSelfReference(node);
    const hasTypeParameters = util.hasNonEmptyArrayProperty(node, 'typeParameters');
    const hasExtender = util.hasNonEmptyArrayProperty(extendsClause, 'types');
    const hasIntersections = util.hasNonEmptyArrayProperty(implementsClause, 'types');

    const elementsReflection = this.elementsReflection(members);

    let reflection = elementsReflection;
    let result: ts.Expression;

    let extender: ts.Expression;
    let intersections: ts.Expression[] = [];

    if (hasIntersections) {
      intersections = implementsClause.types.map(expressionWithTypeArguments => {
        return this.typeReflection(expressionWithTypeArguments);
      });
    }

    if (intersections.length > 0) {
      reflection = [this.propertyAccessCall(this.intersect([...intersections, this.asObject(reflection)]), 'unwrap')];
    }

    if (hasExtender) {
      extender = this.libCall('extend', extendsClause.types.map(expressionWithTypeArguments => {
        return this.typeReflection(expressionWithTypeArguments);
      }));

      reflection.unshift(extender)
    }

    if (hasTypeParameters) {
      const typeParameterDeclarations = node.typeParameters.map(typeParameter => {
        return this.typeParameterDeclaration(typeParameter, typeNameText);
      }, true);

      result = this.selfReference(
        typeNameText,
        ts.createBlock(
          [...typeParameterDeclarations, ts.createReturn(ts.createArrayLiteral(util.asArray(reflection)))],
          true
        )
      );
    } else if (hasSelfReference) {
      result = this.selfReference(typeNameText, ts.createArrayLiteral(reflection));
    }

    const arg = !result && !reflection.length ? this.libCall('object') : result || reflection;

    result = this.asClass(name || typeNameText, arg);

    return result;
  }

  public namedDeclarationsReflections(name: string, declarations: ts.Declaration[]): ts.Expression[] {
    const expressions: ts.Expression[] = [];
    const firstDeclaration = declarations[0];
    const expression = this.namedDeclarationReflection(name, firstDeclaration);

    if (expression) {
      expressions.push(expression);
    }

    return expressions;
  }

  public namedDeclarationReflection(name: string, declaration: ts.Declaration): ts.Expression {
    switch (declaration.kind) {
      case ts.SyntaxKind.InterfaceDeclaration:
        return this.interfaceReflection(declaration as ts.InterfaceDeclaration, name);
      case ts.SyntaxKind.ClassDeclaration:
        return this.classReflection(declaration as ts.ClassDeclaration, name);
      case ts.SyntaxKind.TypeLiteral:
        return this.asType(name, this.typeLiteralReflection(declaration as ts.TypeLiteralNode));
      case ts.SyntaxKind.EnumDeclaration:
        return this.asType(name, this.enumReflection(declaration as ts.EnumDeclaration));
      case ts.SyntaxKind.EnumMember:
        return this.asType(name, this.enumMemberReflection(declaration as ts.EnumMember));
      case ts.SyntaxKind.FunctionDeclaration:
        return this.asType(name, this.functionReflection(declaration as ts.FunctionDeclaration));
      case ts.SyntaxKind.VariableDeclaration:
        return this.asVar(name, this.variableReflection(declaration as ts.VariableDeclaration));
      case ts.SyntaxKind.TypeAliasDeclaration:
        return this.typeAliasReflection(declaration as ts.TypeAliasDeclaration, name);
      default:
        throw new ProgramError(`Could not reflect declaration for ${ts.SyntaxKind[declaration.kind]}`);
    }
  }

  public enumReflection(node: ts.EnumDeclaration): ts.CallExpression {
    return this.libCall('enum', (node.members || [] as ts.EnumMember[]).map(member => {
      return this.enumMemberReflection(member);
    }));
  }

  public enumMemberReflection(node: ts.EnumMember): ts.CallExpression {
    return this.libCall('enumMember', ts.createLiteral(this.context.checker.getConstantValue(node)));
  }

  public variableReflection(node: ts.VariableDeclaration): ts.Expression {
    return this.typeReflection(node.type);
  }

  public functionReflection(node: FunctionLikeNode): ts.CallExpression {
    const parameters = node.parameters || [] as ts.ParameterDeclaration[];

    let args: ts.Expression[] = parameters
      .filter(param => ts.isIdentifier(param.name))
      .map(param => this.parameterReflection(param));

    args.push(this.returnTypeReflection(node.type));

    if (node.typeParameters && node.typeParameters.length > 0) {
      const statements: ts.Statement[] = [];

      for (let typeParameter of node.typeParameters) {
        statements.push(this.typeParameterDeclaration(typeParameter, `${this.namespace}fn`));
      }

      statements.push(ts.createReturn(ts.createArrayLiteral(args)));

      const block = ts.createBlock(statements, true);

      args = [this.selfReference(`${this.namespace}fn`, block)];
    }

    return this.libCall('function', args);
  }

  public returnTypeReflection(node: ts.TypeNode): ts.CallExpression {
    return this.libCall('return', this.typeReflection(node));
  }

  public typeParameterReflection(typeParameter: ts.TypeParameterDeclaration, prop = this.lib): ts.CallExpression {
    const args: ts.Expression[] = [
      ts.createLiteral(typeParameter.name.text)
    ];

    if (typeParameter.constraint) {
      args.push(this.typeReflection(typeParameter.constraint))
    }

    if (typeParameter.default) {
      if (!typeParameter.constraint) {
        args.push(ts.createVoidZero());
      }

      args.push(this.typeReflection(typeParameter.default))
    }

    return this.propertyAccessCall(prop, 'typeParameter', args);
  }

  public indexSignatureReflection(node: ts.IndexSignatureDeclaration): ts.CallExpression {
    return this.libCall('indexer', [
      this.declarationNameToLiteralOrExpression(node.parameters[0].name),
      this.typeReflection(node.parameters[0].type),
      this.typeReflection(node.type)
    ]);
  }

  public propertySignatureReflection(node: ts.PropertySignature | ts.PropertyDeclaration): ts.CallExpression {
    const args: ts.Expression[] = [
      this.propertyNameToLiteralOrExpression(node.name),
      this.typeReflection(node.type)
    ];


    if (node.questionToken) {
      args.push(ts.createTrue());
    }

    return this.libCall(util.isStatic(node as ts.PropertyDeclaration) ? 'staticProperty' : 'property', args);
  }

  public propertyReflection(node: ts.PropertyDeclaration): ts.CallExpression {
    return this.propertySignatureReflection(node);
  }

  public callSignatureReflection(node: ts.CallSignatureDeclaration | ts.ConstructSignatureDeclaration): ts.CallExpression {
    return this.libCall(util.isStatic(node) ? 'staticCallProperty' : 'callProperty', this.functionReflection(node));
  }

  public constructSignatureReflection(node: ts.ConstructSignatureDeclaration): ts.CallExpression {
    return this.callSignatureReflection(node);
  }

  public constructorReflection(node: ts.ConstructorDeclaration): ts.CallExpression {
    return this.libCall('property', [
      ts.createLiteral('constructor'),
      this.nullable(this.functionReflection(node))
    ]);
  }

  public methodReflection(node: MethodLikeNode): ts.CallExpression {
    return this.methodSignatureReflection(node);
  }

  public methodSignatureReflection(node: MethodLikeNode): ts.CallExpression {
    return this.libCall(util.isStatic(node) ? 'staticProperty' : 'property', [
      this.propertyNameToLiteralOrExpression(node.name),
      this.nullable(this.functionReflection(node))
    ]);
  }

  public getAccessorReflection(node: ts.GetAccessorDeclaration): ts.CallExpression {
    return this.methodReflection(node);
  }

  public setAccessorReflection(node: ts.SetAccessorDeclaration): ts.CallExpression {
    return this.methodReflection(node);
  }

  public parameterReflection(param: ts.ParameterDeclaration, reflectType = true): ts.CallExpression {
    const parameter: ts.Expression[] = [
      this.declarationNameToLiteralOrExpression(param.name),
      reflectType ?
        this.typeReflection(param.type) :
        ts.createIdentifier(this.context.getTypeDeclarationName((param.name as ts.Identifier).text))
    ];

    if (param.questionToken) {
      parameter.push(ts.createTrue());
    }

    return this.libCall(param.dotDotDotToken ? 'rest' : 'param', parameter);
  }

  public elementReflection(node: ts.TypeElement | ts.ClassElement): ts.CallExpression {
    switch (node.kind) {
      case ts.SyntaxKind.Constructor:
        return this.constructorReflection(node as ts.ConstructorDeclaration);
      case ts.SyntaxKind.ConstructSignature:
        return this.constructSignatureReflection(node as ts.ConstructSignatureDeclaration);
      case ts.SyntaxKind.IndexSignature:
        return this.indexSignatureReflection(node as ts.IndexSignatureDeclaration);
      case ts.SyntaxKind.PropertyDeclaration:
        return this.propertySignatureReflection(node as ts.PropertySignature);
      case ts.SyntaxKind.PropertySignature:
        return this.propertyReflection(node as ts.PropertyDeclaration);
      case ts.SyntaxKind.CallSignature:
        return this.callSignatureReflection(node as ts.CallSignatureDeclaration);
      case ts.SyntaxKind.MethodSignature:
        return this.methodSignatureReflection(node as ts.MethodSignature);
      case ts.SyntaxKind.MethodDeclaration:
        return this.methodReflection(node as ts.MethodDeclaration);
      case ts.SyntaxKind.GetAccessor:
        return this.getAccessorReflection(node as ts.GetAccessorDeclaration);
      case ts.SyntaxKind.SetAccessor:
        return this.setAccessorReflection(node as ts.SetAccessorDeclaration);
      case ts.SyntaxKind.Parameter:
        return null;
      default:
        throw new Error(`No type element reflection for syntax kind '${ts.SyntaxKind[node.kind]}' found.`);
    }
  }

  public elementsReflection(nodes: (ts.TypeElement | ts.ClassElement)[], merge = true): ts.Expression[] {
    if (merge) return this.mergedElementsReflection(nodes);
    return nodes.map(node => this.elementReflection(node));
  }

  private mergedElementsReflection(nodes: ElementLikeNode[]): ts.Expression[] {
    type CallableSignature = ts.CallSignatureDeclaration | ts.ConstructSignatureDeclaration;
    type MethodSignature = ts.MethodSignature | ts.MethodDeclaration;
    type Signature = ts.MethodSignature | ts.MethodDeclaration | CallableSignature;

    const methodSignatures: Map<string, Set<MethodSignature>> = new Map();
    const staticMethodSignatures: Map<string, Set<MethodSignature>> = new Map();
    const callableSignatures: Set<CallableSignature> = new Set();
    const staticCallableSignatures: Set<CallableSignature> = new Set();

    const elements = nodes.map(node => {
      if (this.context.isImplementationOfOverload(node)) {
        return null;
      }

      switch (node.kind) {
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.MethodDeclaration:
          {
            let id: string;

            if (ts.isIdentifier(node.name)) {
              id = node.name.text;
            } else if (ts.isStringLiteral(node.name)) {
              id = node.name.text;
            } else if (ts.isNumericLiteral(node.name)) {
              id = node.name.text;
            } else {
              id = node.name.getText();
            }

            const collection = util.isStatic(node) ? staticMethodSignatures : methodSignatures;
            if (!collection.has(id)) collection.set(id, new Set());
            collection.get(id).add(node as MethodSignature);
            return null;
          }
        case ts.SyntaxKind.CallSignature:
          {
            const collection = util.isStatic(node) ? staticCallableSignatures : callableSignatures;
            collection.add(node as ts.CallSignatureDeclaration);
            return null;
          }
        case ts.SyntaxKind.ConstructSignature:
          {
            let collection = util.isStatic(node) ? staticCallableSignatures : callableSignatures;
            collection.add(node as ts.ConstructSignatureDeclaration);
            return null;
          }
        default:
          return this.elementReflection(node);
      }
    }).filter(node => !!node);

    const mergeSignature = (signatures: Set<MethodSignature> | Set<CallableSignature>) => {
      if (signatures.size === 0) {
        return null;
      }

      const returnTypes: ts.TypeNode[] = [];
      const returnTypesSet: Set<string> = new Set();;

      const parameterTypes: Map<number, ts.TypeNode[]> = new Map();
      const parameterTypesMap: Map<number, Set<string>> = new Map();

      let minParameters = Array.from(signatures as Set<Signature>)
        .map(node => {
          return util.asArray(node.parameters)
            .filter(param => !param.questionToken && !param.dotDotDotToken);
        })
        .map(params => {
          return params.length;
        })
        .reduce((a, b) => {
          return Math.min(a, b);
        });

      const typeParameters: ts.TypeParameterDeclaration[] = [];
      const typeParametersSet: Set<string> = new Set();

      let lastSignature: Signature;

      (signatures as Set<any>).forEach((node: Signature) => {
        lastSignature = node;

        // return type
        const typeInfo = this.scanner.getTypeInfo(node);
        const returnTypeText = typeInfo.typeText;

        if (!returnTypesSet.has(returnTypeText)) {
          returnTypesSet.add(returnTypeText);
          returnTypes.push(node.type);
        }

        // type parameters
        for (let typeParameter of node.typeParameters || []) {
          const typeParameterText = typeParameter.name.text;

          if (!typeParametersSet.has(typeParameterText)) {
            typeParametersSet.add(typeParameterText);
            typeParameters.push(typeParameter);
          }
        }

        // parameters
        let parameterIndex = 0;
        for (let parameter of node.parameters) {

          const typeInfo = this.scanner.getTypeInfo(parameter);
          const parameterTypeText = typeInfo.typeText;

          if (!parameterTypesMap.has(parameterIndex)) {
            parameterTypesMap.set(parameterIndex, new Set([parameterTypeText]));
            parameterTypes.set(parameterIndex, [parameter.type]);
          } else {
            const parameterTypeTexts = parameterTypesMap.get(parameterIndex);

            if (!parameterTypeTexts.has(parameterTypeText)) {
              parameterTypesMap.get(parameterIndex).add(parameterTypeText);
              parameterTypes.get(parameterIndex).push(parameter.type);
            }
          }

          parameterIndex++;
        }

      });

      let returnTypeNode: ts.TypeNode;

      if (returnTypes.length === 1) {
        returnTypeNode = returnTypes[0];
      } else if (returnTypes.length > 1) {
        returnTypeNode = ts.createNode(ts.SyntaxKind.UnionType) as ts.TypeNode;
        (returnTypeNode as ts.UnionTypeNode).types = ts.createNodeArray(returnTypes);
      } else {
        returnTypeNode = ts.createNode(ts.SyntaxKind.AnyKeyword) as ts.TypeNode;
      }

      let parameterDeclarations: ts.ParameterDeclaration[] = [];

      parameterTypes.forEach((paramTypes, index) => {
        const param = paramTypes[0].parent as ts.ParameterDeclaration;

        let parameterTypeNode: ts.TypeNode;
        if (paramTypes.length === 1) {
          parameterTypeNode = paramTypes[0];
        } else if (paramTypes.length > 0) {
          parameterTypeNode = ts.createNode(ts.SyntaxKind.UnionType) as ts.TypeNode;
          (parameterTypeNode as ts.UnionTypeNode).types = ts.createNodeArray(paramTypes);
        } else {
          parameterTypeNode = ts.createNode(ts.SyntaxKind.AnyKeyword) as ts.TypeNode;
        }

        const questionToken = index + 1 > minParameters ? ts.createToken(ts.SyntaxKind.QuestionToken) : undefined;

        const parameterDeclaration = ts.createParameter(
          undefined, undefined, undefined, param.name,
          questionToken, parameterTypeNode, undefined
        );

        parameterDeclarations.push(parameterDeclaration);
      });

      let mergedSignature: Signature;

      switch (lastSignature.kind) {
        case ts.SyntaxKind.MethodSignature:
          mergedSignature = ts.createMethodSignature(
            typeParameters, parameterDeclarations, returnTypeNode, lastSignature.name, undefined
          );
          break;
        case ts.SyntaxKind.MethodDeclaration:
          mergedSignature = ts.createMethod(
            undefined, lastSignature.modifiers, (lastSignature as ts.MethodDeclaration).asteriskToken,
            lastSignature.name, undefined, typeParameters, parameterDeclarations,
            returnTypeNode, undefined
          );
          break;
        case ts.SyntaxKind.CallSignature:
        case ts.SyntaxKind.ConstructSignature:
          mergedSignature = ts.createCallSignature(typeParameters, parameterDeclarations, returnTypeNode);
          break;
        default:
          throw new ProgramError(`Could not merge ${ts.SyntaxKind[(lastSignature as Signature).kind]}.`);
      }


      return this.elementReflection(mergedSignature);
    }

    elements.push(mergeSignature(callableSignatures));
    elements.push(mergeSignature(staticCallableSignatures));

    methodSignatures.forEach((signatures) => {
      elements.push(mergeSignature(signatures));
    });

    staticMethodSignatures.forEach((signatures) => {
      elements.push(mergeSignature(signatures));
    });

    return elements.filter(element => !!element);
  }

  public classTypeParameterSymbolDeclaration(name: string | ts.Identifier): ts.VariableDeclarationList {
    return ts.createVariableDeclarationList([ts.createVariableDeclaration(
      this.context.getTypeSymbolDeclarationName(name),
      undefined,
      ts.createCall(
        ts.createIdentifier('Symbol'),
        undefined,
        [ts.createLiteral(this.context.getTypeSymbolDeclarationInitializer(name))]
      )
    )], ts.NodeFlags.Const);
  }

  public classTypeParameterSymbolConstructorDeclaration(name: string | ts.Identifier): ts.ExpressionStatement {
    return ts.createStatement(
      ts.createBinary(
        ts.createElementAccess(
          ts.createThis(),
          ts.createIdentifier(this.context.getTypeSymbolDeclarationName(name))
        ),
        ts.SyntaxKind.EqualsToken,
        ts.createIdentifier(this.context.getTypeParametersDeclarationName())
      )
    );
  }

  public classTypeParameterSymbolPropertyDeclaration(name: string | ts.Identifier): ts.PropertyDeclaration {
    return ts.createProperty(
      undefined,
      [ts.createToken(ts.SyntaxKind.StaticKeyword)],
      ts.createComputedPropertyName(
        ts.createPropertyAccess(
          ts.createIdentifier(this.context.getLibDeclarationName()),
          ts.createIdentifier('TypeParametersSymbol')
        )
      ),
      undefined,
      undefined,
      ts.createIdentifier(this.context.getTypeSymbolDeclarationName(name))
    );
  }

  public typeParameterDeclaration(typeParameter: ts.TypeParameterDeclaration, prop = this.lib): ts.VariableStatement {
    const callExpression = this.typeParameterReflection(typeParameter, prop);
    return ts.createVariableStatement(
      undefined,
      ts.createVariableDeclarationList(
        [ts.createVariableDeclaration(typeParameter.name.text, undefined, callExpression)],
        ts.NodeFlags.Const
      )
    );
  }

  public typeParametersLiteral(typeParameters: ts.TypeParameterDeclaration[], asStatement = false): ts.Expression {
    return ts.createObjectLiteral(
      typeParameters.map(param => {
        return ts.createPropertyAssignment(param.name, this.typeParameterReflection(param));
      }),
      true
    );
  }

  public typeParametersLiteralDeclaration(typeParameters: ts.TypeParameterDeclaration[]): ts.VariableStatement {
    return ts.createVariableStatement(
      undefined,
      ts.createVariableDeclarationList(
        [
          ts.createVariableDeclaration(
            this.context.getTypeParametersDeclarationName(),
            undefined,
            this.typeParametersLiteral(typeParameters)
          )
        ],
        ts.NodeFlags.Const
      )
    );
  }

  public typeParameterBindingDeclaration(typeArguments: ts.TypeNode[]): ts.ExpressionStatement {
    // this.setGlobalFlags(FactoryFlags.NoFlowInto);

    return ts.createStatement(
      ts.createCall(
        ts.createPropertyAccess(
          ts.createIdentifier(this.context.getLibDeclarationName()),
          ts.createIdentifier('bindTypeParameters')
        ),
        undefined,
        [
          ts.createThis(),
          ...typeArguments.map(arg => this.typeReflection(arg))
        ]
      )
    );
  }

  public assertReturnStatements<T extends ts.Node>(node: T, type?: ts.TypeNode): T {
    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
      if (type && util.isAnyKeyword(type)) {
        return node;
      }

      if ((node as any).type && util.isAnyKeyword((node as any).type)) {
        return node;
      }

      if (util.isKind(node, ts.SyntaxKind.FunctionDeclaration, ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction)) {
        return node;
      }

      if (ts.isReturnStatement(node)) {
        if (this.context.isSafeAssignment(type, node.expression)) {
          return node;
        }

        const assertion = this.typeAssertion(
          this.context.getTypeDeclarationName('return'),
          node.expression
        );

        return ts.updateReturn(node, assertion);
      }

      return ts.visitEachChild(node, visitor, this.context.transformationContext);
    };

    return ts.visitEachChild(node, visitor, this.context.transformationContext);
  }

  public mutateFunctionBody(node: FunctionDeclarationLikeNode): FunctionDeclarationLikeNode {
    if (!node.body) {
      return node;
    }

    if (ts.isArrowFunction(node) && !ts.isBlock(node.body)) {
      const body = ts.createBlock([ts.createReturn(node.body)], true)
      node = ts.updateArrowFunction(node, node.modifiers, node.typeParameters, node.parameters, node.type, body);
    }

    const bodyDeclarations: ts.Statement[] = [];
    const bodyAssertions: ts.Statement[] = [];

    if (node.typeParameters && node.typeParameters.length > 0) {
      for (let typeParameter of node.typeParameters) {
        bodyDeclarations.push(this.typeParameterDeclaration(typeParameter));
      }
    }

    for (let param of node.parameters) {
      if (util.isAnyKeyword(param.type)) {
        continue;
      }

      if (!ts.isIdentifier(param.name)) {
        continue;
      }

      const paramNameDeclaration = this.context.getTypeDeclarationName(param.name.text);

      bodyDeclarations.push(
        ts.createVariableStatement(
          [], ts.createVariableDeclarationList(
            [
              ts.createVariableDeclaration(
                paramNameDeclaration, undefined, this.typeReflection(param.type)
              )
            ], ts.NodeFlags.Let
          )
        )
      );

      bodyAssertions.push(
        ts.createStatement(
          this.typeAssertion(
            this.parameterReflection(param, false),
            ts.createIdentifier(param.name.text)
          )
        )
      );
    }

    if (node.type && !util.isAnyKeyword(node.type)) {
      bodyDeclarations.push(
        ts.createVariableStatement(
          [], ts.createVariableDeclarationList(
            [
              ts.createVariableDeclaration(
                this.context.getReturnTypeDeclarationName(),
                undefined,
                this.returnTypeReflection(node.type)
              )
            ], ts.NodeFlags.Const
          )
        )
      );
    }


    let body = ts.updateBlock(
      node.body as ts.Block,
      this.assertReturnStatements(node.body as ts.Block, node.type).statements
    );

    let bodyStatements: ts.Statement[] = (body && body.statements) || [];

    bodyStatements.unshift(...bodyAssertions);
    bodyStatements.unshift(...bodyDeclarations);

    body = ts.updateBlock(body, bodyStatements);

    let method: FunctionDeclarationLikeNode;

    switch (node.kind) {
      case ts.SyntaxKind.Constructor:
        method = ts.updateConstructor(
          node, node.decorators, node.modifiers, node.parameters, body
        );
        break;
      case ts.SyntaxKind.MethodDeclaration:
        method = ts.updateMethod(
          node, node.decorators, node.modifiers, node.asteriskToken, node.name,
          node.questionToken, node.typeParameters, node.parameters, node.type, body
        );
        break;
      case ts.SyntaxKind.GetAccessor:
        method = ts.updateGetAccessor(
          node, node.decorators, node.modifiers, node.name, node.parameters, node.type, body
        );
        break;
      case ts.SyntaxKind.SetAccessor:
        method = ts.updateSetAccessor(
          node, node.decorators, node.modifiers, node.name, node.parameters, body
        );
        break;
      case ts.SyntaxKind.FunctionExpression:
        method = ts.updateFunctionExpression(
          node, node.modifiers, node.asteriskToken, node.name as ts.Identifier,
          node.typeParameters, node.parameters, node.type, body
        );
        break;
      case ts.SyntaxKind.FunctionDeclaration:
        method = ts.updateFunctionDeclaration(
          node, node.decorators, node.modifiers, node.asteriskToken, node.name as ts.Identifier,
          node.typeParameters, node.parameters, node.type, body
        );
        break;
      case ts.SyntaxKind.ArrowFunction:
        method = ts.updateArrowFunction(
          node, node.modifiers, node.typeParameters, node.parameters, node.type, body
        );
        break;
    }

    return method;
  }

  public propertyNameToLiteralOrExpression(node: ts.PropertyName): ts.Expression | ts.StringLiteral | ts.NumericLiteral {
    switch (node.kind) {
      case ts.SyntaxKind.Identifier:
        return ts.createLiteral(node.text);
      case ts.SyntaxKind.StringLiteral:
        let str = node.text;
        return ts.createLiteral(str.substring(1, str.length - 1));
      case ts.SyntaxKind.NumericLiteral:
        return ts.createNumericLiteral(node.text);
      case ts.SyntaxKind.ComputedPropertyName:
        return node.expression;
      default:
        throw new Error(`Property name for syntax kind '${ts.SyntaxKind[(node as any).kind]}' could not be generated.`);
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

  public importLibStatement(): ts.ImportDeclaration {
    return ts.createImportDeclaration(
      undefined, undefined, ts.createImportClause(
        ts.createIdentifier(this.context.factory.lib), undefined),
      ts.createLiteral(this.context.factory.package)
    );
  }

  public importDeclarationsStatement(): ts.ImportDeclaration {
    return ts.createImportDeclaration(
      undefined, undefined, undefined, ts.createLiteral(`./${this.context.options.declarationFileName}`)
    );
  }

  public decorate(expressions: ts.Expression | ts.Expression[]): ts.CallExpression {
    return this.libCall('decorate', expressions);
  }

  public annotate(expressions: ts.Expression | ts.Expression[]): ts.CallExpression {
    return this.libCall('annotate', expressions);
  }

  public nullable<T extends ts.Expression>(reflection: T): T | ts.CallExpression {
    return this.strictNullChecks ? reflection : this.libCall('nullable', reflection);
  }

  public nostrict<T extends ts.Expression>(reflection: T): T | ts.CallExpression {
    return this.strictNullChecks ? reflection : this.libCall('nullable', reflection);
  }

  public intersect(args: ts.Expression | ts.Expression[]): ts.CallExpression {
    return this.libCall('intersect', args);
  }

  public flowInto(args: ts.Expression | ts.Expression[]): ts.CallExpression {
    return this.libCall('flowInto', args);
  }

  public tdz(body: ts.Identifier, name?: string): ts.CallExpression {
    const args = [
      ts.createArrowFunction(
        undefined, undefined, [], undefined,
        ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        body
      ),
      ts.createLiteral(body)
    ];

    if (name) {
      args.push(ts.createLiteral(name));
    }

    return this.libCall(
      'tdz', args
    );
  }

  public selfReference(name: string | ts.Identifier | ts.ObjectBindingPattern | ts.ArrayBindingPattern, body: ts.ConciseBody): ts.ArrowFunction {
    return ts.createArrowFunction(
      undefined, undefined, [ts.createParameter(undefined, undefined, undefined, name)], undefined,
      ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      body
    );
  }

  public asObject(nodes: ts.Expression[]): ts.CallExpression {
    return this.libCall('object', nodes);
  }

  public asRef(arg: ts.Expression): ts.CallExpression {
    return this.libCall('ref', arg);
  }

  public asType(name: string | ts.Identifier, args: ts.Expression | ts.Expression[], keyword = 'type'): ts.CallExpression {
    args = util.asArray(args);
    args.unshift(ts.createLiteral(name as any));
    return this.libCall(keyword, args);
  }

  public asClass(name: string | ts.Identifier, args: ts.Expression | ts.Expression[]): ts.CallExpression {
    return this.asType(name, args, 'class');
  }

  public asVar(name: string, expression: ts.Expression): ts.CallExpression {
    return this.libCall('var', [ts.createLiteral(name), expression]);
  }

  public asStatement(expression: ts.Expression): ts.ExpressionStatement {
    return ts.createStatement(expression);
  }

  public libCall(prop: string | ts.Identifier, args: ts.Expression | ts.Expression[] = []): ts.CallExpression {
    return this.propertyAccessCall(this.lib, prop, args);
  }

  public propertyAccessCall(id: string | ts.Expression, prop: string | ts.Identifier, args: ts.Expression | ts.Expression[] = []): ts.CallExpression {
    id = typeof id === 'string' ? ts.createIdentifier(id) : id;
    args = util.asArray(args);

    return ts.createCall(ts.createPropertyAccess(id, prop), [], args);
  }

  private addState(state: FactoryState): void {
    if (state === undefined) return;
    let counter = this._state.get(state) || 0;
    this._state.set(state, ++counter);
  }

  private removeState(state: FactoryState): void {
    if (state === undefined) return;
    let counter = this._state.get(state) || 1;
    if (counter < 0) counter = 0;
    this._state.set(state, --counter);
    if (counter === 0) this._state.delete(state);
  }

  public state(state: FactoryState): boolean {
    return this._state.has(state);
  }

  public rule(rule: FactoryState[]): boolean {
    for (let state of rule) {
      if (this.state(state)) {
        return true;
      }
    }

    return false;
  }

  public match(rule: FactoryState[], state: FactoryState): boolean {
    return rule.indexOf(state) !== -1;
  }

  get scanner(): Scanner {
    return this.context.scanner;
  }

  get context(): MutationContext {
    return this._context;
  }

  set context(context: MutationContext) {
    this._context = context;
  }

  get strictNullChecks(): boolean {
    return this._strictNullChecks;
  }

  set strictNullChecks(strictNullChecks: boolean) {
    this._strictNullChecks = strictNullChecks;
  }

  get lib(): string {
    return `${this.namespace}${this._lib}`;
  }

  get package(): string {
    return this._load;
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

}

export enum FactoryState {
  None,
  TypeDeclaration,
  TypeAssertion,
  TypeDeclarationAndAssertion,
  AnyTypeReflection,
  NumberTypeReflection,
  BooleanTypeReflection,
  StringTypeReflection,
  SymbolTypeReflection,
  ObjectTypeReflection,
  VoidTypeReflection,
  NullTypeReflection,
  UndefinedTypeReflection,
  ThisTypeReflection,
  LiteralTypeReflection,
  BooleanLiteralTypeReflection,
  NumericLiteralTypeReflection,
  StringLiteralTypeReflection,
  ArrayTypeReflection,
  TupleTypeReflection,
  UnionTypeReflection,
  IntersectionTypeReflection,
  TypeReferenceReflection,
  FunctionTypeReflection,
  ConstructorTypeReflection,
  TypeQueryReflection,
  TypeLiteralReflection,
  ExpressionWithTypeArgumentsReflection,
  TypeAliasReflection,
  TypeAliasSubstitution,
  InterfaceReflection,
  InterfaceSubstitution,
  ClassReflection,
  NamedDeclarationReflection,
  NamedDeclarationsReflections,
  EnumReflection,
  EnumMemberReflection,
  VariableReflection,
  FunctionReflection,
  MethodSignatureReflection,
  MethodReflection,
  GetAccessorReflection,
  SetAccessorReflection,
  ConstructorReflection,
  ParameterReflection,
  ReturnTypeReflection,
  TypeParameterReflection,
  ElementReflection,
  ElementsReflection,
  MergedElementsReflection,
  IndexSignatureReflection,
  PropertySignatureReflection,
  PropertyReflection,
  CallSignatureReflection,
  ConstructSignatureReflection,
  ClassTypeParameterSymbolDeclaration,
  ClassTypeParameterSymbolConstructorDeclaration,
  ClassTypeParameterSymbolPropertyDeclaration,
  TypeParameterDeclaration,
  TypeParametersLiteral,
  TypeParametersLiteralDeclaration,
  TypeParameterBindingDeclaration,
  AssertReturnStatements,
  MutateFunctionBody,
  ImportLibStatement,
  ImportDeclarationsStatement,
  Decorate,
  Annotate,
  Nullable,
  NoStrict,
  Intersect,
  FlowInto,
  Tdz,
  SelfReference,
  AsObject,
  AsRef,
  AsType,
  AsClass,
  AsVar,
  AsStatement,
}

export const FactoryRule = {
  NoClassTypeParameterReflection: [
    FactoryState.ClassReflection,
    FactoryState.NamedDeclarationReflection
  ],
  NoFlowInto: [
    FactoryState.ReturnTypeReflection,
    FactoryState.ExpressionWithTypeArgumentsReflection,
    FactoryState.TypeParameterBindingDeclaration,
    FactoryState.InterfaceReflection,
    FactoryState.TypeAliasReflection
  ],
  Nullable: [
    FactoryState.NumberTypeReflection,
    FactoryState.BooleanTypeReflection,
    FactoryState.StringTypeReflection,
    FactoryState.SymbolTypeReflection,
    FactoryState.ObjectTypeReflection,
    FactoryState.UndefinedTypeReflection,
    FactoryState.ThisTypeReflection,
    FactoryState.LiteralTypeReflection,
    FactoryState.ArrayTypeReflection,
    FactoryState.TupleTypeReflection,
    FactoryState.UnionTypeReflection,
    FactoryState.IntersectionTypeReflection,
    FactoryState.TypeReferenceReflection,
    FactoryState.FunctionTypeReflection,
    FactoryState.ConstructorTypeReflection
  ],
  Property: [
    FactoryState.PropertySignatureReflection,
    FactoryState.MethodSignatureReflection,
    FactoryState.ConstructorReflection
  ]
};
