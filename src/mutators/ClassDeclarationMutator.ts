import * as ts from 'typescript';
import { Mutator } from './Mutator';

type HasTypeMember = ts.MethodDeclaration | ts.SetAccessorDeclaration | ts.GetAccessorDeclaration |
  ts.ConstructorDeclaration | ts.PropertyDeclaration;

enum DeclarationType {
  Method,
  StaticMethod,
  Property,
  StaticProperty
};

export class ClassDeclarationMutator extends Mutator {

  protected kind = ts.SyntaxKind.ClassDeclaration;

  public mutate(node: ts.ClassDeclaration): ts.Node {
    const members: ts.ClassElement[] = [];
    const assertAny = this.context.options.assertAny;

    for (let member of node.members) {
      switch (member.kind) {
        case ts.SyntaxKind.Constructor:
          break;
        case ts.SyntaxKind.MethodDeclaration:
          {
            const m = (member as ts.MethodDeclaration);
            const implicitType = this.context.getImplicitTypeNode(m.name) as ts.FunctionTypeNode;
            const isStatic = this.isStatic(m);
            const notAny = implicitType.type.kind !== ts.SyntaxKind.AnyKeyword;
            const assert = notAny || assertAny;

            const bodyStatements = m.body.statements;

            const bodyDeclarations: ts.Statement[] = [];
            const bodyAssertions: ts.Statement[] = []

            for (let param of implicitType.parameters) {
              const paramNameDeclaration = this.context.getTypeDeclarationName(param.name.getText());
              const notAny = param.type.kind !== ts.SyntaxKind.AnyKeyword;
              const assert = notAny || assertAny;

              if (assert) {
                bodyDeclarations.push(
                  ts.createVariableStatement(
                    [], ts.createVariableDeclarationList(
                      [
                        ts.createVariableDeclaration(
                          paramNameDeclaration, undefined, this.context.generator.typeDefinition(param.type)
                        )
                      ], ts.NodeFlags.Let
                    )
                  )
                );

                bodyAssertions.push(
                  ts.createStatement(
                    this.context.generator.parameterAssertion(param.name.getText(), paramNameDeclaration)
                  )
                );
              }
            }

            if (assert && this.hasReturn(m)) {
              const returnNameDeclaration = this.context.getTypeDeclarationName('return');

              bodyDeclarations.push(
                ts.createVariableStatement(
                  [], ts.createVariableDeclarationList(
                    [
                      ts.createVariableDeclaration(
                        returnNameDeclaration, undefined, this.context.generator.returnDeclaration(implicitType.type)
                      )
                    ], ts.NodeFlags.Const
                  )
                )
              );

              // TODO: this is wrong. We need to find all return statements, that can return a value from the function.
              const index = this.returnStatementIndex(m);
              const returnStatement = bodyStatements[index] as ts.ReturnStatement;
              returnStatement.expression = this.context.generator.returnAssertion(returnNameDeclaration, returnStatement.expression);
              bodyStatements[index] = returnStatement;

              this.context.addVisited(returnStatement, true);
            }

            bodyStatements.unshift(...bodyAssertions);
            bodyStatements.unshift(...bodyDeclarations);

            bodyAssertions.forEach(assertion => {
              this.context.addVisited(assertion, true);
            });

            bodyDeclarations.forEach(declaration => {
              this.context.addVisited(declaration, true);
            });

            const body = ts.updateBlock(m.body, bodyStatements);

            const method = ts.updateMethod(
              m, m.decorators, m.modifiers, m.asteriskToken, m.name, m.typeParameters, m.parameters, m.type, body
            );

            members.push(method);
          }

          break;
        case ts.SyntaxKind.GetAccessor:
          // check return type only?
          break;
        case ts.SyntaxKind.SetAccessor:
          // check parameter type
          break;
        case ts.SyntaxKind.PropertyDeclaration:
          // annotate
          break;
        default:
          members.push(member);
      }
    }

    // const decorator = this.context.generator.annotationDecorator();

    node = ts.updateClassDeclaration(
      node, node.decorators, node.modifiers, node.name, node.typeParameters, node.heritageClauses, members
    );

    return node;
  }

  private hasReturn(node: ts.MethodDeclaration): boolean {
    return !node.body || !node.body.statements ? false : node.body.statements.findIndex(el => el.kind === ts.SyntaxKind.ReturnStatement) !== -1;
  }

  private returnStatementIndex(node: ts.MethodDeclaration): number {
    return !node.body || !node.body.statements ? -1 : node.body.statements.findIndex(el => el.kind === ts.SyntaxKind.ReturnStatement);
  }

  private isStatic(node: HasTypeMember): boolean {
    return !node.modifiers ? false : node.modifiers.findIndex(el => el.kind === ts.SyntaxKind.StaticKeyword) !== -1;
  }

}
