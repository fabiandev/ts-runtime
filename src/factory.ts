import * as ts from 'typescript';
import * as util from './util';
import { ProgramError } from './errors';
import { Scanner, TypeInfo } from './scanner';
import { MutationContext } from './context';

export type FunctionDeclarationLikeNode = ts.ArrowFunction | ts.FunctionDeclaration |
  ts.FunctionExpression | ts.ArrowFunction | ts.ConstructorDeclaration | ts.MethodDeclaration |
  ts.SetAccessorDeclaration | ts.GetAccessorDeclaration;

export type FunctionLikeNode = ts.FunctionExpression | ts.ArrowFunction | ts.FunctionDeclaration |
  ts.FunctionTypeNode | ts.ConstructorTypeNode | ts.ConstructorDeclaration | ts.CallSignatureDeclaration | ts.ConstructSignatureDeclaration |
  ts.MethodSignature | ts.MethodDeclaration | ts.SetAccessorDeclaration | ts.GetAccessorDeclaration;

export type MethodLikeNode = ts.ConstructorTypeNode | ts.ConstructorDeclaration | ts.CallSignatureDeclaration | ts.ConstructSignatureDeclaration |
  ts.MethodSignature | ts.MethodDeclaration | ts.SetAccessorDeclaration | ts.GetAccessorDeclaration;

export type ElementLike = ts.TypeElement | ts.ClassElement;

export class Factory {

  private _state: Map<FactoryState, number> = new Map();

  constructor(private _context: MutationContext, private _strictNullChecks = false, private _lib = 't', private _namespace = '_', private _load = 'ts-runtime/lib') {
    return new Proxy(this, {
      get: this.proxy.bind(this)
    });
  }

  private proxy(target: Factory, property: string, receiver: any) {
    const destination = (target as any)[property];

    if (typeof destination !== 'function') {
      return destination;
    }

    const flagName = property.charAt(0).toUpperCase() + property.slice(1);
    const flagsEnum = FactoryState as any as { [index: string]: number };

    let lastFlag = 0;

    return (...args: any[]) => {
      const state = flagsEnum[flagName];

      this.addState(state);

      let result = destination.bind(receiver)(...args);

      if (this.match(FactoryRule.Nullable, state)) {
        result = this.nullable(result);
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
      case ts.SyntaxKind.MappedType: // TODO: implement
        throw new ProgramError('Mapped types are not yet supported.')
      // type Readonly<T> = {
      //   readonly [P in keyof T]: T[P];
      // }
      case ts.SyntaxKind.IndexedAccessType: // TODO: implement
        throw new ProgramError('Indexed acces types are not yet supported.')
      // function getProperty<T, K extends keyof T>(o: T, name: K): T[K] {
      //     return o[name]; // o[name] is of type T[K]
      // }
      case ts.SyntaxKind.TypeOperator: // TODO: implement
        throw new ProgramError('Type operators are not yet supported.')
      // keyof
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

  public anyTypeReflection(): ts.Expression {
    return this.libCall('any');
  }

  public numberTypeReflection(): ts.Expression {
    return this.libCall('number');
  }

  public booleanTypeReflection(): ts.Expression {
    return this.libCall('boolean');
  }

  public stringTypeReflection(): ts.Expression {
    return this.libCall('string');
  }

  public symbolTypeReflection(): ts.Expression {
    return this.libCall('symbol');
  }

  public objectTypeReflection(): ts.Expression {
    return this.libCall('object');
  }

  public voidTypeReflection(): ts.Expression {
    return this.libCall('void');
  }

  public nullTypeReflection(): ts.Expression {
    return this.libCall('null');
  }

  public undefinedTypeReflection(): ts.Expression {
    return this.libCall('undef');
  }

  public thisTypeReflection(): ts.Expression {
    return this.libCall('this', ts.createThis());
  }

  public literalTypeReflection(node: ts.LiteralTypeNode): ts.Expression {
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

  public booleanLiteralTypeReflection(node: ts.BooleanLiteral): ts.Expression {
    return this.libCall('boolean', ts.createLiteral(
      node.kind === ts.SyntaxKind.TrueKeyword ? true : false
    ));
  }

  public numericLiteralTypeReflection(node: ts.NumericLiteral): ts.Expression {
    return this.libCall('number', ts.createNumericLiteral(node.text));
  }

  public stringLiteralTypeReflection(node: ts.StringLiteral): ts.Expression {
    return this.libCall('string', ts.createLiteral(node.text));
  }

  public arrayTypeReflection(node: ts.ArrayTypeNode): ts.Expression {
    return this.libCall('array', this.typeReflection(node.elementType));
  }

  public tupleTypeReflection(node: ts.TupleTypeNode): ts.Expression {
    return this.libCall('tuple', node.elementTypes.map(n => this.typeReflection(n)));
  }

  public unionTypeReflection(node: ts.UnionTypeNode): ts.Expression {
    return this.libCall('union', node.types.map(n => this.typeReflection(n)));
  }

  public intersectionTypeReflection(node: ts.IntersectionTypeNode): ts.Expression {
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

    const isSelfReference = this.context.isSelfReference(node);
    const isDeclared = this.context.isDeclared(node.typeName);
    const wasDeclared = this.context.wasDeclared(node.typeName);
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

  public functionTypeReflection(node: ts.FunctionTypeNode): ts.Expression {
    return this.functionReflection(node);
  }

  public constructorTypeReflection(node: ts.ConstructorTypeNode): ts.Expression {
    return this.methodReflection(node);
  }

  public typeQueryReflection(node: ts.TypeQueryNode): ts.Expression {
    return this.libCall('typeOf', ts.createIdentifier(util.getEntityNameText(node.exprName)));
  }

  public typeLiteralReflection(node: ts.TypeLiteralNode) {
    return this.asObject(this.elementsReflection(util.asArray(node.members)))
  }

  public expressionWithTypeArgumentsReflection(node: ts.ExpressionWithTypeArguments): ts.Expression {
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
      let sf = typeInfo.declarations[0].getSourceFile().fileName;
      let hash = util.getHash(sf);
      let name = this.context.checker.getFullyQualifiedName(typeInfo.symbol);
      name = name || typeNameText;
      name = `${name}.${hash}`;

      id = ts.createLiteral(name);
    } else {
      id = ts.createIdentifier(typeNameText);
    }

    if (!asLiteral && !wasDeclared && isDeclared) {
      id = this.tdz(id as ts.Identifier);
    }

    args.push(id);
    args.push(...(node.typeArguments || [] as ts.TypeNode[]).map(a => this.typeReflection(a/*, FactoryFlags.NoFlowInto*/)));

    return this.libCall(keyword, args);
  }

  public typeAliasReflection(node: ts.TypeAliasDeclaration, name?: string): ts.Expression {
    const typeNameText = util.getEntityNameText(node.name);
    const hasSelfReference = this.context.hasSelfReference(node);
    const hasTypeParameters = util.hasNonEmptyArrayProperty(node, 'typeParameters');

    const reflection = this.typeReflection(node.type);

    let result = reflection;

    if (hasSelfReference && !hasTypeParameters) {
      return this.selfReference(typeNameText, result);
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
    }

    return this.asType(name || typeNameText, result);
  }

  public typeAliasSubstitution(node: ts.TypeAliasDeclaration): ts.Statement {
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

    let result = reflection;

    if (hasExtender) {
      const intersections = extendsClause.types.map(expressionWithTypeArguments => {
        return this.typeReflection(expressionWithTypeArguments);
      });

      result = this.intersect([...intersections, result])
    }

    if (hasSelfReference && !hasTypeParameters) {
      return this.selfReference(typeNameText, result);
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

  public namedDeclarationsReflections(names: string[], declarations: ts.Declaration[]): ts.Expression[] {
    const expressions: ts.Expression[] = [];
    const firstDeclaration = declarations[0];
    const expression = this.namedDeclarationReflection(names[0], firstDeclaration);

    if (expression) {
      expressions.push(expression);

      for (let i = 1; i < names.length; i++) {
        expressions.push(this.asType(names[i], this.libCall('ref', ts.createLiteral(names[0]))));
      }
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
      case ts.SyntaxKind.ModuleDeclaration:
      default:
        throw new ProgramError(`Could not reflect declaration for ${ts.SyntaxKind[declaration.kind]}`);
    }
  }

  public enumReflection(node: ts.EnumDeclaration): ts.Expression {
    return this.libCall('enum', (node.members || [] as ts.EnumMember[]).map(member => {
      return this.enumMemberReflection(member);
    }));
  }

  public enumMemberReflection(node: ts.EnumMember): ts.Expression {
    return this.libCall('enumMember', ts.createLiteral(this.context.checker.getConstantValue(node)));
  }

  public variableReflection(node: ts.VariableDeclaration): ts.Expression {
    return this.typeReflection(node.type);
  }

  public functionReflection(node: FunctionLikeNode): ts.Expression {
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

    // if (isClass) {
    //   const isStatic = util.isStaticClassElement(node as ts.ClassElement);
    //
    //   return this.libCall(isStatic ? 'staticMethod' : 'method', [
    //     this.propertyNameToLiteralOrExpression(node.name),
    //     ...args
    //   ]);
    // }

    return this.libCall('function', args);
  }

  // private getProperties(node: ts.ClassDeclaration | ts.ClassExpression | ts.InterfaceDeclaration | ts.TypeLiteralNode): (ts.TypeElement | ts.ClassElement)[] {
  //   const typeInfo = this.scanner.getTypeInfo(node);
  //   const merged: Set<ts.TypeElement | ts.ClassElement> = new Set();
  //   let type: ts.Type;
  //
  //   if (!typeInfo) {
  //     type = this.context.checker.getTypeAtLocation(node);
  //   } else {
  //     type = typeInfo.type;
  //   }
  //
  //   if (!type) {
  //     return node.members;
  //   }
  //   // this.context.checker.getSymbolsOfParameterPropertyDeclaration
  //   // this.context.checker.getAugmentedPropertiesOfType
  //   // this.context.checker.getSignatureFromDeclaration
  //   (type.getProperties() || []).forEach(sym => {
  //     for (let typeElement of ((sym.getDeclarations() || []) as (ts.TypeElement | ts.ClassElement)[])) {
  //       merged.add(typeElement);
  //     }
  //   });
  //
  //   return Array.from(merged);
  // }
  // public classReflection(node: ts.ClassDeclaration): ts.Expression {
  //   const args = this.mergedElementsReflection(
  //     // this.getProperties(node) as ts.ClassElement[],
  //     node.members,
  //     true
  //   );
  //
  //   let typeAliasExpressions = args;
  //
  //   if (this.context.hasSelfReference(node)) {
  //     typeAliasExpressions = [this.selfReference(node.name, ts.createArrayLiteral(args))];
  //   }
  //
  //   typeAliasExpressions.unshift(ts.createLiteral(node.name));
  //
  //   const extendsClause = util.getExtendsClause(node);
  //
  //   if (extendsClause) {
  //     typeAliasExpressions.push(this.libCall('extends', extendsClause.types[0].expression));
  //   }
  //
  //   return this.libCall('class', typeAliasExpressions);
  // }
  //
  // public classReflection(node: ts.ClassDeclaration): ts.Expression {
  //   const args = node.members.map(member => this.classElementReflection(member)).filter(member => !!member);
  //   args.unshift(ts.createLiteral(node.name));
  //   return this.libCall('class', args);
  // }
  //
  // public classElementReflection(node: ts.ClassElement): ts.Expression {
  //   switch (node.kind) {
  //     case ts.SyntaxKind.Constructor:
  //       return this.constructorReflection(node as ts.ConstructorDeclaration)
  //     case ts.SyntaxKind.MethodDeclaration:
  //       return this.methodDeclarationReflection(node as ts.MethodDeclaration);
  //     case ts.SyntaxKind.GetAccessor:
  //       return this.getAccessorReflection(node as ts.GetAccessorDeclaration);
  //     case ts.SyntaxKind.SetAccessor:
  //       return this.setAccessorReflection(node as ts.SetAccessorDeclaration);
  //     case ts.SyntaxKind.PropertyDeclaration:
  //       return this.propertyDeclarationReflection(node as ts.PropertyDeclaration);
  //     case ts.SyntaxKind.IndexSignature:
  //       return this.indexSignatureReflection(node as ts.IndexSignatureDeclaration);
  //     default:
  //       // TODO: TypeElement can occur here on interface/class declaration merging
  //       // throw new Error(`No class class member reflection for syntax kind ${ts.SyntaxKind[node.kind]} found.`);
  //       console.log(`No class class member reflection for syntax kind ${ts.SyntaxKind[node.kind]} found.`);
  //       return null;
  //   }
  // }

  //   public methodDeclarationReflection(node: ts.MethodDeclaration): ts.Expression {
  //   const isStatic = util.isStaticClassElement(node);
  //   const args: ts.Expression[] = node.parameters.map(param => this.parameterReflection(param));
  //
  //   args.push(this.returnTypeReflection(node.type));
  //   args.unshift(this.propertyNameToLiteralOrExpression(node.name));
  //
  //   return this.libCall(isStatic ? 'staticMethod' : 'method', args);
  // }
  //   public getAccessorReflection(node: ts.GetAccessorDeclaration): ts.Expression {
  //   return this.methodDeclarationReflection(node as any);
  // }
  //   public setAccessorReflection(node: ts.SetAccessorDeclaration): ts.Expression {
  //   return this.methodDeclarationReflection(node as any);
  // }
  //   public propertyDeclarationReflection(node: ts.PropertyDeclaration): ts.Expression {
  //   const isStatic = util.isStaticClassElement(node);
  //
  //   const args: ts.Expression[] = [
  //     this.propertyNameToLiteralOrExpression(node.name),
  //     this.typeReflection(node.type)
  //   ];
  //
  //
  //   if (node.questionToken) {
  //     args.push(ts.createTrue());
  //   }
  //
  //   return this.libCall(isStatic ? 'staticProperty' : 'property', args);
  // }

  public returnTypeReflection(node: ts.TypeNode): ts.Expression {
    return this.libCall('return', this.typeReflection(node/*, FactoryFlags.NoFlowInto*/));
  }

  public typeParameterReflection(typeParameter: ts.TypeParameterDeclaration, prop = this.lib): ts.Expression {
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

  public indexSignatureReflection(node: ts.IndexSignatureDeclaration): ts.Expression {
    return this.libCall('indexer', [
      this.declarationNameToLiteralOrExpression(node.parameters[0].name),
      this.typeReflection(node.parameters[0].type),
      this.typeReflection(node.type)
    ]);
  }

  public propertySignatureReflection(node: ts.PropertySignature | ts.PropertyDeclaration): ts.Expression {
    const args: ts.Expression[] = [
      this.propertyNameToLiteralOrExpression(node.name),
      this.typeReflection(node.type)
    ];


    if (node.questionToken) {
      args.push(ts.createTrue());
    }

    return this.libCall(util.isStatic(node as ts.PropertyDeclaration) ? 'staticProperty' : 'property', args);
  }

  public propertyReflection(node: ts.PropertyDeclaration): ts.Expression {
    return this.propertySignatureReflection(node);
  }

  public callSignatureReflection(node: ts.CallSignatureDeclaration | ts.ConstructSignatureDeclaration): ts.Expression {
    return this.libCall(util.isStatic(node) ? 'staticCallProperty' : 'callProperty', this.functionReflection(node));
  }

  public constructSignatureReflection(node: ts.ConstructSignatureDeclaration): ts.Expression {
    return this.callSignatureReflection(node);
  }

  public constructorReflection(node: ts.ConstructorDeclaration): ts.Expression {
    return this.libCall('property', [
      ts.createLiteral('constructor'),
      this.functionReflection(node)
    ]);
  }

  public methodReflection(node: MethodLikeNode): ts.Expression {
    return this.methodSignatureReflection(node);
  }

  public methodSignatureReflection(node: MethodLikeNode): ts.Expression {
    return this.libCall(util.isStatic(node) ? 'staticProperty' : 'property', [
      this.propertyNameToLiteralOrExpression(node.name),
      this.functionReflection(node)
    ]);
  }

  public getAccessorReflection(node: ts.GetAccessorDeclaration): ts.Expression {
    return this.methodReflection(node);
  }

  public setAccessorReflection(node: ts.SetAccessorDeclaration): ts.Expression {
    return this.methodReflection(node);
  }

  public parameterReflection(param: ts.ParameterDeclaration, reflectType = true): ts.Expression {
    const parameter: ts.Expression[] = [
      this.declarationNameToLiteralOrExpression(param.name),
      reflectType ? this.typeReflection(param.type) : ts.createIdentifier(this.context.getTypeDeclarationName((param.name as ts.Identifier).text))
    ];

    if (param.questionToken) {
      parameter.push(ts.createTrue());
    }

    return this.libCall(param.dotDotDotToken ? 'rest' : 'param', parameter);
  }

  public elementReflection(node: ts.TypeElement | ts.ClassElement): ts.Expression {
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
      default:
        throw new Error(`No type element reflection for syntax kind '${ts.SyntaxKind[node.kind]}' found.`);
    }
  }

  public elementsReflection(nodes: (ts.TypeElement | ts.ClassElement)[], merge = true): ts.Expression[] {
    if (merge) return this.mergedElementsReflection(nodes);
    return nodes.map(node => this.elementReflection(node));
  }

  private mergedElementsReflection(nodes: ElementLike[]): ts.Expression[] {
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
            const id = node.name.getText();
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
        const returnTypeText = node.type.getText();

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
          const parameterTypeText = parameter.type.getText();

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

  // TODO: refactor and handle computed property names
  // use node.name as index (not getText())
  // private mergedElementsReflection_old(nodes: (ts.TypeElement | ts.ClassElement)[]): ts.Expression[] {
  //   const mergeGroups: Map<string, ts.SignatureDeclaration[]> = new Map();
  //
  //   let elements = nodes.map(node => {
  //     switch (node.kind) {
  //       case ts.SyntaxKind.MethodSignature:
  //       case ts.SyntaxKind.MethodDeclaration:
  //       case ts.SyntaxKind.GetAccessor:
  //       // case ts.SyntaxKind.Constructor:
  //       case ts.SyntaxKind.SetAccessor:
  //         {
  //           if (ts.isFunctionLike(node) && this.context.checker.isImplementationOfOverload(node)) {
  //             return null;
  //           }
  //
  //           const text = node.name.getText();
  //
  //           if (!mergeGroups.has(text)) {
  //             mergeGroups.set(text, []);
  //           }
  //
  //           const el = mergeGroups.get(text);
  //           el.push(node as ts.MethodSignature | ts.MethodDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration);
  //
  //           return null;
  //         }
  //       case ts.SyntaxKind.CallSignature:
  //         {
  //           if (ts.isFunctionLike(node) && this.context.checker.isImplementationOfOverload(node)) {
  //             return null;
  //           }
  //
  //           const text = '';
  //
  //           if (!mergeGroups.has(text)) {
  //             mergeGroups.set(text, []);
  //           }
  //
  //           const el = mergeGroups.get(text);
  //           el.push(node as ts.CallSignatureDeclaration);
  //
  //           return null;
  //         }
  //     }
  //
  //     return this.elementReflection(node);
  //   }).filter(element => !!element);
  //
  //   mergeGroups.forEach((group, name) => {
  //     const returnTypes: ts.TypeNode[] = [];
  //     const hasReturnTypes: string[] = [];
  //
  //     const parameterTypes: Map<number, ts.TypeNode[]> = new Map();
  //     const hasParameterTypes: Map<number, string[]> = new Map();
  //
  //     const typeParameters: ts.TypeParameterDeclaration[] = [];
  //     const hasTypeParameters: string[] = [];
  //
  //     for (let node of group) {
  //
  //       if (node.type) {
  //         const returnTypeText = node.type.getText();
  //
  //         if (hasReturnTypes.indexOf(returnTypeText) === -1) {
  //           hasReturnTypes.push(returnTypeText);
  //           returnTypes.push(node.type);
  //         }
  //       }
  //
  //       if (node.typeParameters) {
  //         for (let typeParameter of node.typeParameters) {
  //           const typeParameterText = typeParameter.name.getText();
  //
  //           if (hasTypeParameters.indexOf(typeParameterText) === -1) {
  //             hasTypeParameters.push(typeParameterText);
  //             typeParameters.push(typeParameter);
  //           }
  //         }
  //       }
  //
  //       let parameterIndex = 0;
  //       for (let parameter of node.parameters) {
  //         // const parameterNameText = parameter.name.getText();
  //         const parameterTypeText = parameter.type.getText();
  //
  //         if (!hasParameterTypes.has(parameterIndex)) {
  //           hasParameterTypes.set(parameterIndex, []);
  //         }
  //
  //         const parameterTypeTexts = hasParameterTypes.get(parameterIndex);
  //
  //         if (parameterTypeTexts.indexOf(parameterTypeText) === -1) {
  //           parameterTypeTexts.push(parameterTypeText);
  //
  //           if (!parameterTypes.has(parameterIndex)) {
  //             parameterTypes.set(parameterIndex, []);
  //           }
  //
  //           parameterTypes.get(parameterIndex).push(parameter.type);
  //         }
  //
  //         parameterIndex++;
  //       }
  //     }
  //
  //     let returnTypeNode = returnTypes[0];
  //     if (returnTypes.length > 1) {
  //       returnTypeNode = ts.createNode(ts.SyntaxKind.UnionType) as ts.TypeNode;
  //       (returnTypeNode as ts.UnionTypeNode).types = ts.createNodeArray(returnTypes);
  //     }
  //
  //     let parameterDeclarations: ts.ParameterDeclaration[] = [];
  //
  //     parameterTypes.forEach((paramTypes, index) => {
  //       const param = paramTypes[0].parent as ts.ParameterDeclaration;
  //
  //       let parameterTypeNode = paramTypes[0];
  //       if (paramTypes.length > 1) {
  //         parameterTypeNode = ts.createNode(ts.SyntaxKind.UnionType) as ts.TypeNode;
  //         (parameterTypeNode as ts.UnionTypeNode).types = ts.createNodeArray(paramTypes);
  //       }
  //
  //       const parameterDeclaration = ts.createParameter(
  //         param.decorators, param.modifiers, param.dotDotDotToken, param.name.getText(),
  //         param.questionToken, parameterTypeNode, param.initializer
  //       );
  //
  //       parameterDeclarations.push(parameterDeclaration);
  //     });
  //
  //     let mergedSignature: ts.TypeElement | ts.ClassElement;
  //
  //     switch (group[0].kind) {
  //       case ts.SyntaxKind.MethodSignature:
  //         mergedSignature = ts.createMethodSignature(
  //           typeParameters, parameterDeclarations, returnTypeNode, name, (group[0] as ts.MethodSignature).questionToken
  //         );
  //         break;
  //       case ts.SyntaxKind.MethodDeclaration:
  //       case ts.SyntaxKind.GetAccessor:
  //       case ts.SyntaxKind.SetAccessor:
  //         mergedSignature = ts.createMethod(
  //           group[0].decorators, group[0].modifiers, (group[0] as ts.MethodDeclaration).asteriskToken, name, (group[0] as ts.MethodDeclaration).questionToken, typeParameters, parameterDeclarations, returnTypeNode, undefined
  //           // group[0].typeParameters, parameterDeclarations, returnTypeNode, name, (group[0] as ts.MethodSignature).questionToken
  //         );
  //         break;
  //       case ts.SyntaxKind.CallSignature:
  //         mergedSignature = ts.createCallSignature(typeParameters, parameterDeclarations, returnTypeNode);
  //         break;
  //     }
  //
  //
  //     elements.push(this.elementReflection(mergedSignature));
  //   });
  //
  //   return elements;
  // }

  //   public methodSignatureReflection(node: ts.MethodSignature, isClass: boolean): ts.Expression {
  //   return this.libCall('property', [
  //     this.propertyNameToLiteralOrExpression(node.name),
  //     this.methodTypeReflection(node, isClass)
  //   ]);
  // }

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

  public classTypeParameterSymbolConstructorDeclaration(name: string | ts.Identifier): ts.Statement {
    return ts.createStatement(
      ts.createBinary(
        ts.createElementAccess(ts.createThis(), ts.createIdentifier(this.context.getTypeSymbolDeclarationName(name))),
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

  public typeParameterDeclaration(typeParameter: ts.TypeParameterDeclaration, prop = this.lib): ts.Statement {
    const callExpression = this.typeParameterReflection(typeParameter, prop);
    return ts.createVariableStatement(undefined, ts.createVariableDeclarationList([ts.createVariableDeclaration(typeParameter.name.text, undefined, callExpression)], ts.NodeFlags.Const));
  }

  public typeParametersLiteral(typeParameters: ts.TypeParameterDeclaration[], asStatement = false): ts.Expression {
    return ts.createObjectLiteral(
      typeParameters.map(param => {
        return ts.createPropertyAssignment(param.name, this.typeParameterReflection(param));
      }),
      true
    );
  }

  public typeParametersLiteralDeclaration(typeParameters: ts.TypeParameterDeclaration[]): ts.Statement {
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

  public typeParameterBindingDeclaration(typeArguments: ts.TypeNode[]): ts.Statement {
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
      if (type && type.kind === ts.SyntaxKind.AnyKeyword) {
        return node;
      }

      if ((node as any).type && (node as any).type.kind === ts.SyntaxKind.AnyKeyword) {
        return node;
      }

      if (node.kind === ts.SyntaxKind.FunctionDeclaration || node.kind === ts.SyntaxKind.FunctionExpression || node.kind === ts.SyntaxKind.ArrowFunction) {
        return node;
      }

      if (node.kind === ts.SyntaxKind.ReturnStatement) {
        // if (this.context.isSafeAssignment(type, (node as ts.ReturnStatement).expression)) {
        //   return node;
        // }

        const assertion = this.typeAssertion(
          this.context.getTypeDeclarationName('return'),
          (node as ts.ReturnStatement).expression
        );

        const substitution = ts.updateReturn((node as ts.ReturnStatement), assertion);
        // this.context.skip(substitution, true, (node as ts.ReturnStatement).expression);

        return substitution;
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
      if (param.type.kind === ts.SyntaxKind.AnyKeyword) {
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

      bodyAssertions.push(ts.createStatement(this.typeAssertion(this.parameterReflection(param, false), ts.createIdentifier(param.name.text))));
    }

    if (node.type && node.type.kind !== ts.SyntaxKind.AnyKeyword) {
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


    let body = ts.updateBlock(node.body as ts.Block, this.assertReturnStatements(node.body as ts.Block, node.type).statements);
    let bodyStatements: ts.Statement[] = (body && body.statements) || [];

    bodyStatements.unshift(...bodyAssertions);
    bodyStatements.unshift(...bodyDeclarations);

    // bodyAssertions.forEach(assertion => {
    //   this.context.skip(assertion, true);
    // });
    //
    // bodyDeclarations.forEach(declaration => {
    //   this.context.skip(declaration, true);
    // });


    body = ts.updateBlock(body, bodyStatements);

    let method: FunctionDeclarationLikeNode;

    switch (node.kind) {
      case ts.SyntaxKind.Constructor:
        method = ts.updateConstructor(node, node.decorators, node.modifiers, node.parameters, body);
        break;
      case ts.SyntaxKind.MethodDeclaration:
        method = ts.updateMethod(node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.questionToken, node.typeParameters, node.parameters, node.type, body);
        break;
      case ts.SyntaxKind.GetAccessor:
        method = ts.updateGetAccessor(node, node.decorators, node.modifiers, node.name, node.parameters, node.type, body);
        break;
      case ts.SyntaxKind.SetAccessor:
        method = ts.updateSetAccessor(node, node.decorators, node.modifiers, node.name, node.parameters, body);
        break;
      case ts.SyntaxKind.FunctionExpression:
        method = ts.updateFunctionExpression(node, node.modifiers, node.asteriskToken, node.name as ts.Identifier, node.typeParameters, node.parameters, node.type, body);
        break;
      case ts.SyntaxKind.FunctionDeclaration:
        method = ts.updateFunctionDeclaration(node, node.decorators, node.modifiers, node.asteriskToken, node.name as ts.Identifier, node.typeParameters, node.parameters, node.type, body);
        break;
      case ts.SyntaxKind.ArrowFunction:
        method = ts.updateArrowFunction(node, node.modifiers, node.typeParameters, node.parameters, node.type, body);
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

  public importLibStatement(): ts.Statement {
    return ts.createImportDeclaration(
      undefined, undefined, ts.createImportClause(
        ts.createIdentifier(this.context.factory.lib), undefined),
      ts.createLiteral(this.context.factory.package)
    );
  }

  public importDeclarationsStatement(): ts.Statement {
    return ts.createImportDeclaration(
      undefined, undefined, undefined, ts.createLiteral(`./${this.context.options.declarationFile}`)
    );
  }

  public decorate(expressions: ts.Expression | ts.Expression[]): ts.Expression {
    return this.libCall('decorate', expressions);
  }

  public annotate(expressions: ts.Expression | ts.Expression[]): ts.Expression {
    return this.libCall('annotate', expressions);
  }

  public nullable(reflection: ts.Expression, ): ts.Expression {
    return this.strictNullChecks ? reflection : this.libCall('nullable', reflection);
  }

  public intersect(args: ts.Expression | ts.Expression[]): ts.Expression {
    return this.libCall('intersect', args);
  }

  public flowInto(args: ts.Expression | ts.Expression[]) {
    return this.libCall('flowInto', args);
  }

  // TODO: no tdz if self reference
  public tdz(body: ts.Identifier, name?: string): ts.Expression {
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

  public asObject(nodes: ts.Expression[]): ts.Expression {
    return this.libCall('object', nodes);
  }

  public asRef(arg: ts.Expression): ts.Expression {
    return this.libCall('ref', arg);
  }

  public asType(name: string | ts.Identifier, args: ts.Expression | ts.Expression[], keyword = 'type'): ts.Expression {
    args = util.asArray(args);
    args.unshift(ts.createLiteral(name as any));
    return this.libCall(keyword, args);
  }

  public asClass(name: string | ts.Identifier, args: ts.Expression | ts.Expression[]): ts.Expression {
    return this.asType(name, args, 'class');
  }

  public asVar(name: string, expression: ts.Expression): ts.Expression {
    return this.libCall('var', [ts.createLiteral(name), expression]);
  }

  public asStatement(expression: ts.Expression): ts.Statement {
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

  // public flag(flag: FactoryFlags) {
  //   return !!(this.flags & flag);
  // }

  // get flags(): number {
  //   return this._flags;
  // }

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
  ]
};
