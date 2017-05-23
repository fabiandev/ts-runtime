import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

type FunctionLikeProperty = ts.ConstructorDeclaration | ts.MethodDeclaration |
  ts.SetAccessorDeclaration | ts.GetAccessorDeclaration;

export class ClassDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.ClassDeclaration;

  protected mutate(node: ts.ClassDeclaration): ts.Node {
    const nodeAttributes = this.scanner.getAttributes(node);

    let members: ts.ClassElement[] = [];

    const classReflection = this.factory.classReflection(node);
    const decorators = util.asNewArray(node.decorators);
    const decorator = ts.createDecorator(this.factory.annotate(classReflection));
    this.context.addVisited(decorator, true);
    decorators.unshift(decorator);

    for (let member of node.members) {
      switch (member.kind) {
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
          if ((member as FunctionLikeProperty).body) {
            member = this.mutateMethodDeclaration(member as FunctionLikeProperty, node);
          }
          members.push(member);
          break;
        case ts.SyntaxKind.PropertyDeclaration:
          members.push(this.mutatePropertyDeclaration(member as ts.PropertyDeclaration));
          break;
        case ts.SyntaxKind.IndexSignature:
        default:
          members.push(member);
      }
    }

    members = this.assertImplementing(node, members);

    if (node.typeParameters && node.typeParameters.length > 0) {
      members = this.declareTypeParameters(node, members);
    }

    this.context.processed.push(nodeAttributes.type.symbol);

    return ts.updateClassDeclaration(
      node, decorators, node.modifiers, node.name, node.typeParameters, node.heritageClauses, members
    );
  }

  private assertImplementing(node: ts.ClassDeclaration, members: ts.ClassElement[]): ts.ClassElement[] {
    const implementsClause = util.getImplementsClause(node);
    const isImplementing = !!implementsClause;

    if (!isImplementing) {
      return members;
    }

    const extendsClause = util.getExtendsClause(node);
    const isExtending = !!extendsClause;
    const constructorIndex = members.findIndex(member => member.kind === ts.SyntaxKind.Constructor);
    const hasConstructor = constructorIndex !== -1;

    let constructor: ts.ConstructorDeclaration;
    let statements: ts.Statement[] = [];

    if (hasConstructor) {
      constructor = members[constructorIndex] as ts.ConstructorDeclaration;
    } else {
      constructor = ts.createConstructor(undefined, undefined,
        isExtending ? [ts.createParameter(undefined, undefined, ts.createToken(ts.SyntaxKind.DotDotDotToken), 'args')] : undefined,
        ts.createBlock([], true)
      );

      if (isExtending) {
        statements.push(
          ts.createStatement(
            ts.createCall(ts.createSuper(), undefined, [ts.createSpread(ts.createIdentifier('args'))])
          )
        );
      }
    }

    for (let impl of implementsClause.types || []) {
      statements.push(ts.createStatement(this.factory.typeAssertion(this.factory.asRef(impl.expression), ts.createThis())));
    }

    let newStatements = util.asNewArray(constructor.body.statements);
    newStatements.unshift(...statements);

    constructor = ts.updateConstructor(
      constructor,
      constructor.decorators,
      constructor.modifiers,
      constructor.parameters,
      ts.updateBlock(constructor.body, newStatements)
    );

    if (hasConstructor) {
      members[constructorIndex] = constructor;
    } else {
      members.unshift(constructor);
    }

    return members;
  }

  private declareTypeParameters(node: ts.ClassDeclaration, members: ts.ClassElement[]): ts.ClassElement[] {
    const constructorIndex = members.findIndex(member => member.kind === ts.SyntaxKind.Constructor);
    const hasConstructor = constructorIndex !== -1;
    const extendsClause = util.getExtendsClause(node);
    const isExtending = !!extendsClause;

    let constructor: ts.ConstructorDeclaration;
    let statements: ts.Statement[] = [];

    const typeParametersStatement: ts.Statement = ts.createVariableStatement(
      undefined,
      ts.createVariableDeclarationList(
        [
          ts.createVariableDeclaration(
            this.context.getTypeParametersDeclarationName(),
            undefined,
            ts.createObjectLiteral(
              node.typeParameters.map(param => {
                return ts.createPropertyAssignment(param.name, this.factory.typeParameterReflection(param));
              }),
              true
            )
          )
        ],
        ts.NodeFlags.Const
      )
    );

    statements.push(typeParametersStatement);

    if (hasConstructor) {
      constructor = members[constructorIndex] as ts.ConstructorDeclaration;
    } else {
      constructor = ts.createConstructor(undefined, undefined,
        isExtending ? [ts.createParameter(undefined, undefined, ts.createToken(ts.SyntaxKind.DotDotDotToken), 'args')] : undefined,
        ts.createBlock([], true)
      );

      if (isExtending) {
        statements.push(
          ts.createStatement(
            ts.createCall(ts.createSuper(), undefined, [ts.createSpread(ts.createIdentifier('args'))])
          )
        );
      }
    }

    const thisStatement = ts.createStatement(
      ts.createBinary(
        ts.createElementAccess(ts.createThis(), ts.createIdentifier(this.context.getTypeSymbolDeclarationName(node.name))),
        ts.SyntaxKind.EqualsToken,
        ts.createIdentifier(this.context.getTypeParametersDeclarationName())
      )
    );

    let bindStatement: ts.Statement;

    if (isExtending && extendsClause.types[0].typeArguments) {
      const extender = extendsClause.types[0];

      if (extender.typeArguments.length > 0) {
        bindStatement = ts.createStatement(
          ts.createCall(
            ts.createPropertyAccess(
              ts.createIdentifier(this.context.getLibDeclarationName()),
              ts.createIdentifier('bindTypeParameters')
            ),
            undefined,
            [
              ts.createThis(),
              ...extender.typeArguments.map(arg => this.factory.typeReflection(arg))
            ]
          )
        );
      }
    }

    let newStatements = util.asNewArray(constructor.body.statements);
    newStatements.unshift(...statements);

    const superIndex = newStatements.findIndex(statement => util.isSuperStatement(statement));

    let toInsert: ts.Statement[] = [thisStatement];
    if (bindStatement) toInsert.push(bindStatement);

    if (superIndex !== -1) {
      newStatements.splice(superIndex + 1, 0, ...toInsert);
    } else {
      newStatements.splice(statements.length, 0, ...toInsert);
    }

    constructor = ts.updateConstructor(
      constructor,
      constructor.decorators,
      constructor.modifiers,
      constructor.parameters,
      ts.updateBlock(constructor.body, newStatements)
    );

    if (hasConstructor) {
      members[constructorIndex] = constructor;
    } else {
      members.unshift(constructor);
    }

    members.unshift(ts.createProperty(
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
      ts.createIdentifier(this.context.getTypeSymbolDeclarationName(node.name))
    ));

    return members;
  }

  private mutatePropertyDeclaration(node: ts.PropertyDeclaration): ts.PropertyDeclaration {
    const decorators = util.asNewArray(node.decorators);
    const decorator = ts.createDecorator(this.factory.decorate(this.factory.typeReflection(node.type)));
    decorators.unshift(decorator);
    this.context.addVisited(decorator, true);
    return ts.updateProperty(node, decorators, node.modifiers, node.name, node.type, node.initializer);
  }

  private mutateMethodDeclaration(node: FunctionLikeProperty, parent: ts.ClassDeclaration): FunctionLikeProperty {
    const bodyDeclarations: ts.Statement[] = [];
    const bodyAssertions: ts.Statement[] = [];

    if (node.typeParameters && node.typeParameters.length > 0) {
      for (let typeParameter of node.typeParameters) {
        bodyDeclarations.push(this.factory.typeParameterDeclaration(typeParameter));
      }
    }

    for (let param of node.parameters) {
      const paramNameDeclaration = this.context.getTypeDeclarationName(param.name.getText());

      bodyDeclarations.push(
        ts.createVariableStatement(
          [], ts.createVariableDeclarationList(
            [
              ts.createVariableDeclaration(
                paramNameDeclaration, undefined, this.factory.typeReflection(param.type)
              )
            ], ts.NodeFlags.Let
          )
        )
      );

      // TODO: pass BindingName (param.name)
      bodyAssertions.push(ts.createStatement(this.factory.typeAssertion(this.factory.parameterReflection(param, false), ts.createIdentifier(param.name.getText()))));
    }

    const returnNameDeclaration = this.context.getTypeDeclarationName('return');

    bodyDeclarations.push(
      ts.createVariableStatement(
        [], ts.createVariableDeclarationList(
          [
            ts.createVariableDeclaration(
              returnNameDeclaration, undefined, this.factory.returnTypeReflection(node.type)
            )
          ], ts.NodeFlags.Const
        )
      )
    );


    let body = ts.updateBlock(node.body, this.factory.assertReturnStatements(node.body).statements);
    let bodyStatements = body.statements;

    bodyStatements.unshift(...bodyAssertions);
    bodyStatements.unshift(...bodyDeclarations);

    bodyAssertions.forEach(assertion => {
      this.context.addVisited(assertion, true);
    });

    bodyDeclarations.forEach(declaration => {
      this.context.addVisited(declaration, true);
    });

    body = ts.updateBlock(body, bodyStatements);

    let method: FunctionLikeProperty;

    switch (node.kind) {
      case ts.SyntaxKind.Constructor:
        method = ts.updateConstructor(node as ts.ConstructorDeclaration, node.decorators, node.modifiers, node.parameters, body);
        break;
      case ts.SyntaxKind.MethodDeclaration:
        method = ts.updateMethod(node as ts.MethodDeclaration, node.decorators, node.modifiers, node.asteriskToken, node.name, node.questionToken, node.typeParameters, node.parameters, node.type, body);
        break;
      case ts.SyntaxKind.GetAccessor:
        method = ts.updateGetAccessor(node as ts.GetAccessorDeclaration, node.decorators, node.modifiers, node.name, node.parameters, node.type, body);
        break;
      case ts.SyntaxKind.SetAccessor:
        method = ts.updateSetAccessor(node as ts.SetAccessorDeclaration, node.decorators, node.modifiers, node.name, node.parameters, body);
    }

    return method;
  }

}
