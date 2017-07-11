import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

type MethodLikeProperty = ts.ConstructorDeclaration | ts.MethodDeclaration |
  ts.SetAccessorDeclaration | ts.GetAccessorDeclaration;

type PropertySubstitution = ts.PropertyDeclaration | ts.GetAccessorDeclaration |
  ts.SetAccessorDeclaration;

export class ClassDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.ClassDeclaration;
  protected initializers: ts.Statement[] = [];

  protected mutate(node: ts.ClassDeclaration): ts.Node {
    const members: ts.ClassElement[] = [];

    const decorators = this.options.noAnnotate ?
      node.decorators : this.reflectClass(node);

    for (let member of node.members) {
      switch (member.kind) {
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
          members.push(this.mutateMethodDeclaration(member as MethodLikeProperty));
          break;
        case ts.SyntaxKind.PropertyDeclaration:
          members.push(...util.asArray(this.mutatePropertyDeclaration(member as ts.PropertyDeclaration)));
          break;
        case ts.SyntaxKind.IndexSignature:
        default:
          members.push(member);
      }
    }

    this.addInitializers(node, members);
    this.declareTypeParameters(node, members);
    this.assertImplementing(node, members);
    this.setMerged(node);

    return ts.updateClassDeclaration(
      node, decorators, node.modifiers, node.name,
      node.typeParameters, node.heritageClauses, members
    );
  }

  private setMerged(node: ts.ClassDeclaration) {
    const nodeSymbol = this.scanner.getNodeSymbol(node.name);
    this.context.setMerged(nodeSymbol);
  }

  private reflectClass(node: ts.ClassDeclaration): ts.Decorator[] {
    const classReflection = this.factory.classReflection(node);
    const decorators = util.asNewArray(node.decorators);
    const decorator = ts.createDecorator(this.factory.annotate(classReflection));

    decorators.unshift(decorator);

    return decorators;
  }

  private addInitializers(node: ts.ClassDeclaration, members: ts.ClassElement[]): void {
    if (this.initializers.length === 0) {
      return;
    }

    const constructor = this.getConstructor(members);
    let statements = util.asNewArray(constructor.body.statements);

    for (let initializer of this.initializers) {
      statements = util.insertAfterSuper(statements, initializer);
    }

    this.updateConstructor(members, constructor, statements);
  }

  private assertImplementing(node: ts.ClassDeclaration, members: ts.ClassElement[]): ts.ClassElement[] {
    const implementsClause = util.getImplementsClause(node);

    if (!implementsClause) {
      return members;
    }

    let constructor = this.getConstructor(members);
    let statements = util.asNewArray(constructor.body.statements);

    for (let impl of implementsClause.types || []) {
      const assertion = ts.createStatement(
        this.factory.typeAssertion(
          this.factory.expressionWithTypeArgumentsReflection(impl),
          ts.createThis()
        )
      );

      statements.push(assertion);
    }

    this.updateConstructor(members, constructor, statements);

    return members;
  }

  private declareTypeParameters(node: ts.ClassDeclaration, members: ts.ClassElement[]): ts.ClassElement[] {
    const extendsClause = util.getExtendsClause(node);
    const hasTypeParameters = util.hasTypeParameters(node);
    const extendsClauseHasTypeArguments = util.extendsClauseHasTypeArguments(extendsClause);

    if (!hasTypeParameters && !extendsClauseHasTypeArguments) {
      return members;
    }

    let constructor = this.getConstructor(members);
    let statements: ts.Statement[] = util.asNewArray(constructor.body.statements);

    let typeParametersStatement: ts.Statement;
    let thisStatement: ts.Statement;
    let bindStatement: ts.Statement;

    const insert: ts.Statement[] = [];

    if (hasTypeParameters) {
      typeParametersStatement = this.factory.typeParametersLiteralDeclaration(node.typeParameters);
      thisStatement = this.factory.classTypeParameterSymbolConstructorDeclaration(node.name);
      insert.push(typeParametersStatement);
    }

    if (extendsClauseHasTypeArguments) {
      bindStatement = this.factory.typeParameterBindingDeclaration(
        extendsClause.types[0].typeArguments
      );
    }

    insert.push(...[thisStatement, bindStatement].filter(statement => !!statement));
    util.insertAfterSuper(statements, insert);
    this.updateConstructor(members, constructor, statements);

    members.unshift(this.factory.classTypeParameterSymbolPropertyDeclaration(node.name));

    return members;
  }

  private mutatePropertyDeclaration(node: ts.PropertyDeclaration): PropertySubstitution | PropertySubstitution[] {
    if (!this.options.assertAny && this.context.isAny(node.type)) {
      return node;
    }

    if (ts.isComputedPropertyName(node.name)) {
      return node;
    }

    if (util.hasModifier(node, ts.SyntaxKind.AbstractKeyword)) {
      return node;
    }

    // Do not use decorators (for now at least), but define getters and setters for properties.
    // const decorators = util.asNewArray(node.decorators);
    //
    // if (node.initializer) {
    //   const typeReflection = this.factory.typeReflection(node.type);
    //
    //   let decorator: ts.Decorator;
    //
    //   if (util.hasKind(typeReflection, ts.SyntaxKind.ThisKeyword)) {
    //     decorator = ts.createDecorator(this.factory.decorate(
    //       ts.createFunctionExpression(undefined, undefined, undefined, undefined, undefined, undefined,
    //         ts.createBlock([ts.createReturn(typeReflection)], true)
    //       )
    //     ));
    //   } else {
    //     decorator = ts.createDecorator(this.factory.decorate(typeReflection));
    //   }
    //
    //   decorators.unshift(decorator);
    // }
    // ts.createGetAccessor(undefined, node.modifiers, )

    let name = node.name.text;
    if (!ts.isComputedPropertyName(node.name)) {
      name = this.context.getPropertyName(this.node as ts.ClassDeclaration, `_${node.name.text}`)
    }

    if (node.initializer) {
      this.initializers.push(ts.createStatement(
        ts.createBinary(
          ts.createPropertyAccess(ts.createThis(), name),
          ts.SyntaxKind.FirstAssignment,
          this.factory.typeReflectionAndAssertion(node.type, node.initializer)
        )
      ));
    }

    const property = this.map(ts.updateProperty(node, node.decorators, node.modifiers, ts.createIdentifier(name), node.type, undefined), node);

    let setAccessor: ts.SetAccessorDeclaration;
    if (!util.hasModifier(node, ts.SyntaxKind.ReadonlyKeyword)) {
      setAccessor = this.factory.mutateFunctionBody(ts.createSetAccessor(undefined, node.modifiers, node.name, [
        ts.createParameter(undefined, undefined, undefined, node.name.text, undefined, node.type)
      ], ts.createBlock([ts.createStatement(
        ts.createBinary(ts.createPropertyAccess(ts.createThis(), name), ts.SyntaxKind.FirstAssignment, node.name)
      )], true
      ))) as ts.SetAccessorDeclaration;
    }

    const getAccessor = ts.createGetAccessor(undefined, node.modifiers, node.name, undefined, node.type, ts.createBlock(
      [ts.createReturn(
        ts.createPropertyAccess(
          ts.createThis(),
          name
        )
      )], true
    ));

    node.name.text = name;

    return [property, getAccessor, setAccessor].filter(val => !!val);
  }

  private mutateMethodDeclaration(node: MethodLikeProperty): MethodLikeProperty {
    return this.factory.mutateFunctionBody(node) as MethodLikeProperty;
  }

  private getConstructor(members: ts.ClassElement[], create = true): ts.ConstructorDeclaration {
    const index = members.findIndex(member => member.kind === ts.SyntaxKind.Constructor);
    const exists = index !== -1;

    if (exists) {
      return members[index] as ts.ConstructorDeclaration;
    }

    if (!create) {
      return null;
    }

    const extendsClause = util.getExtendsClause(this.node as ts.ClassDeclaration);
    const isExtending = !!extendsClause;

    const constructor = ts.createConstructor(
      undefined, undefined,
      isExtending
        ? [ts.createParameter(undefined, undefined, ts.createToken(ts.SyntaxKind.DotDotDotToken), 'args')]
        : undefined,
      ts.createBlock(
        isExtending
          ? [ts.createStatement(
            ts.createCall(ts.createSuper(), undefined, [ts.createSpread(ts.createIdentifier('args'))])
          )] : [],
        true
      )
    );

    return constructor;
  }

  private updateConstructor(members: ts.ClassElement[], constructor: ts.ConstructorDeclaration, statements: ts.Statement[]): ts.ClassElement[] {
    const index = members.findIndex(member => member.kind === ts.SyntaxKind.Constructor);
    const exists = index !== -1;

    constructor = this.map(ts.updateConstructor(
      constructor,
      constructor.decorators,
      constructor.modifiers,
      constructor.parameters,
      this.map(ts.updateBlock(constructor.body, statements), constructor.body)
    ), constructor);

    if (exists) {
      members[index] = constructor;
    } else {
      members.unshift(constructor);
    }

    return members;
  }

}
