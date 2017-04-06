import * as ts from 'typescript';
import { Mutator } from './Mutator';

type HasTypeMember = ts.MethodDeclaration | ts.SetAccessorDeclaration | ts.GetAccessorDeclaration |
  ts.ConstructorDeclaration | ts.PropertyDeclaration;

type FunctionLikeProperty = ts.ConstructorDeclaration | ts.MethodDeclaration |
  ts.SetAccessorDeclaration | ts.GetAccessorDeclaration

enum DeclarationType {
  Method,
  StaticMethod,
  Property,
  StaticProperty
};

// TODO: support computed properties
export class ClassDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.ClassDeclaration;

  public mutate(node: ts.ClassDeclaration): ts.Node {
    const members: ts.ClassElement[] = [];

    for (let member of node.members) {
      switch (member.kind) {
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
          members.push(this.mutateMethodDeclaration(member as FunctionLikeProperty));
          break;
        case ts.SyntaxKind.PropertyDeclaration:
          members.push(this.mutatePropertyDeclaration(member as ts.PropertyDeclaration));
          break;
        default:
          throw new Error(`Unexpected member ${ts.SyntaxKind[node.kind]} in class declaration.`);
      }
    }

    return ts.updateClassDeclaration(
      node, node.decorators, node.modifiers, node.name, node.typeParameters, node.heritageClauses, members
    );
  }

  private mutatePropertyDeclaration(node: ts.PropertyDeclaration): ts.PropertyDeclaration {
    const decorators = node.decorators || [] as ts.Decorator[];
    const decorator = ts.createDecorator(this.factory.decorate(this.factory.typeReflection(node.type)));
    decorators.unshift(decorator);
    return ts.updateProperty(node, decorators, node.modifiers, node.name, node.type, node.initializer);
  }

  private mutateMethodDeclaration(node: FunctionLikeProperty): FunctionLikeProperty {
    const bodyStatements = node.body.statements || [] as ts.Statement[];

    const bodyDeclarations: ts.Statement[] = [];
    const bodyAssertions: ts.Statement[] = [];

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
      bodyAssertions.push(ts.createStatement(this.factory.typeAssertion(this.factory.parameterReflection(param), ts.createIdentifier(param.name.getText()))));
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

    bodyStatements.unshift(...bodyAssertions);
    bodyStatements.unshift(...bodyDeclarations);

    bodyAssertions.forEach(assertion => {
      this.context.addVisited(assertion, true);
    });

    bodyDeclarations.forEach(declaration => {
      this.context.addVisited(declaration, true);
    });

    const body = ts.updateBlock(node.body, bodyStatements);

    let method: FunctionLikeProperty;
    switch(node.kind) {
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

  // private hasReturn(node: ts.MethodDeclaration): boolean {
  //   return !node.body || !node.body.statements ? false : node.body.statements.findIndex(el => el.kind === ts.SyntaxKind.ReturnStatement) !== -1;
  // }
  //
  // private returnStatementIndex(node: ts.MethodDeclaration): number {
  //   return !node.body || !node.body.statements ? -1 : node.body.statements.findIndex(el => el.kind === ts.SyntaxKind.ReturnStatement);
  // }

  private isStatic(node: HasTypeMember): boolean {
    return !node.modifiers ? false : node.modifiers.findIndex(el => el.kind === ts.SyntaxKind.StaticKeyword) !== -1;
  }

}
