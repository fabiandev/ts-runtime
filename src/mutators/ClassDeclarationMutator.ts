import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

type FunctionLikeProperty = ts.ConstructorDeclaration | ts.MethodDeclaration |
  ts.SetAccessorDeclaration | ts.GetAccessorDeclaration;

export class ClassDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.ClassDeclaration;

  protected mutate(node: ts.ClassDeclaration): ts.Node {
    const nodeAttributes = this.scanner.getAttributes(node);

    const members: ts.ClassElement[] = [];

    const classReflection = this.factory.classReflection(node);
    const decorators = util.asNewArray(node.decorators);
    const decorator = ts.createDecorator(this.factory.annotate(classReflection));
    this.context.addVisited(decorator, true);
    decorators.unshift(decorator);

    for (let member of node.members) {
      if (util.hasModifier(member, ts.SyntaxKind.AbstractKeyword)) {
        continue;
      }

      // TODO: ignore if e.g. methoddeclaration and no body

      switch (member.kind) {
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
          if ((member as FunctionLikeProperty).body) {
            member = this.mutateMethodDeclaration(member as FunctionLikeProperty);
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

    this.context.processed.push(nodeAttributes.type.symbol);

    return ts.updateClassDeclaration(
      node, decorators, node.modifiers, node.name, node.typeParameters, node.heritageClauses, members
    );
  }

  private mutatePropertyDeclaration(node: ts.PropertyDeclaration): ts.PropertyDeclaration {
    const decorators = util.asNewArray(node.decorators);
    const decorator = ts.createDecorator(this.factory.decorate(this.factory.typeReflection(node.type)));
    decorators.unshift(decorator);
    this.context.addVisited(decorator, true);
    return ts.updateProperty(node, decorators, node.modifiers, node.name, node.type, node.initializer);
  }

  private mutateMethodDeclaration(node: FunctionLikeProperty): FunctionLikeProperty {
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
