import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

type MethodLikeProperty = ts.ConstructorDeclaration | ts.MethodDeclaration |
  ts.SetAccessorDeclaration | ts.GetAccessorDeclaration;

export class ClassDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.ClassDeclaration;

  protected mutate(node: ts.ClassDeclaration): ts.Node {
    const members: ts.ClassElement[] = [];

    for (let member of node.members) {
      switch (member.kind) {
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
          members.push(this.mutateMethodDeclaration(member as MethodLikeProperty, node));
          break;
        case ts.SyntaxKind.PropertyDeclaration:
          members.push(this.mutatePropertyDeclaration(member as ts.PropertyDeclaration));
          break;
        case ts.SyntaxKind.IndexSignature:
        default:
          members.push(member);
      }
    }

    this.assertImplementing(node, members);
    this.declareTypeParameters(node, members);
    this.setProcessed(node);

    return ts.updateClassDeclaration(
      node, this.reflectClass(node), node.modifiers, node.name,
      node.typeParameters, node.heritageClauses, members
    );
  }

  private setProcessed(node: ts.ClassDeclaration) {
    const nodeAttributes = this.scanner.getAttributes(node);
    this.context.processed.push(nodeAttributes.type.symbol);
  }

  private reflectClass(node: ts.ClassDeclaration): ts.Decorator[] {
    const classReflection = this.factory.classReflection(node);
    const decorators = util.asNewArray(node.decorators);
    const decorator = ts.createDecorator(this.factory.annotate(classReflection));

    decorators.unshift(decorator);
    this.context.addVisited(decorator, true);

    return decorators;
  }

  private assertImplementing(node: ts.ClassDeclaration, members: ts.ClassElement[]): ts.ClassElement[] {
    const implementsClause = util.getImplementsClause(node);

    if (!implementsClause) {
      return members;
    }

    let constructor = this.getConstructor(members);
    let statements: ts.Statement[] = util.asNewArray(constructor.body.statements);

    for (let impl of implementsClause.types || []) {
      statements.push(
        ts.createStatement(
          this.factory.typeAssertion(this.factory.asRef(impl.expression),
          ts.createThis())
        )
      );
    }

    this.updateConstructor(members, constructor, statements);

    return members;
  }

  private declareTypeParameters(node: ts.ClassDeclaration, members: ts.ClassElement[]): ts.ClassElement[] {
    if (!node.typeParameters || node.typeParameters.length < 1) {
      return members;
    }

    const extendsClause = util.getExtendsClause(node);
    let constructor = this.getConstructor(members);
    let statements: ts.Statement[] = util.asNewArray(constructor.body.statements);

    let typeParametersStatement: ts.Statement;
    let thisStatement: ts.Statement;
    let bindStatement: ts.Statement;

    typeParametersStatement = ts.createVariableStatement(
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

    thisStatement = ts.createStatement(
      ts.createBinary(
        ts.createElementAccess(ts.createThis(), ts.createIdentifier(this.context.getTypeSymbolDeclarationName(node.name))),
        ts.SyntaxKind.EqualsToken,
        ts.createIdentifier(this.context.getTypeParametersDeclarationName())
      )
    );

    if (extendsClause && extendsClause.types[0] && extendsClause.types[0].typeArguments) {
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

    this.insertBeforeSuper(statements, typeParametersStatement);
    this.insertAfterSuper(statements, [thisStatement, bindStatement].filter(statement => !!statement));
    this.updateConstructor(members, constructor, statements);

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

    // TODO: only wrap in function for generics
    const decorator = ts.createDecorator(this.factory.decorate(
      ts.createFunctionExpression(undefined, undefined, undefined, undefined, undefined, undefined,
        ts.createBlock([ts.createReturn(this.factory.typeReflection(node.type))], true)
      )
    ));

    decorators.unshift(decorator);
    this.context.addVisited(decorator, true);

    return ts.updateProperty(node, decorators, node.modifiers, node.name, node.type, node.initializer);
  }

  private mutateMethodDeclaration(node: MethodLikeProperty, parent: ts.ClassDeclaration): MethodLikeProperty {
    if (!node.body) {
      return node;
    }

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

    bodyDeclarations.push(
      ts.createVariableStatement(
        [], ts.createVariableDeclarationList(
          [
            ts.createVariableDeclaration(
              this.context.getReturnTypeDeclarationName(),
              undefined,
              this.factory.returnTypeReflection(node.type)
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

    let method: MethodLikeProperty;

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

  private insertBeforeSuper(statements: ts.Statement[], insert: ts.Statement | ts.Statement[], offset = 0): ts.Statement[] {
    const index = statements.findIndex(statement => util.isSuperStatement(statement));

    insert = util.asArray(insert);

    if (index !== -1) {
      statements.splice(index + offset, 0, ...insert)
    } else {
      statements.splice(statements.length, 0, ...insert);
    }

    return statements;
  }

  private insertAfterSuper(statements: ts.Statement[], insert: ts.Statement | ts.Statement[], offset = 0): ts.Statement[] {
    return this.insertBeforeSuper(statements, insert, 1);
  }

  private updateConstructor(members: ts.ClassElement[], constructor: ts.ConstructorDeclaration, statements: ts.Statement[]): ts.ClassElement[] {
    const index = members.findIndex(member => member.kind === ts.SyntaxKind.Constructor);
    const exists = index !== -1;

    constructor = ts.updateConstructor(
      constructor,
      constructor.decorators,
      constructor.modifiers,
      constructor.parameters,
      ts.updateBlock(constructor.body, statements)
    );

    if (exists) {
      members[index] = constructor;
    } else {
      members.unshift(constructor);
    }

    return members;
  }

}
