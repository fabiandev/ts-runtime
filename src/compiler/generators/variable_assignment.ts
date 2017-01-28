import * as ts from 'typescript';
import * as esprima from 'esprima';
import * as utils from '../utils';

export function variableAssignment(name: string, assignment: ts.Expression) {
  const text = assignment.getText();
  const callExpression = utils.ast.getCallExpression('assert', `_${name}Type`);
  // const transpiled = ts.transpileModule(assignment.getText(), {});
  // console.log(transpiled);
  const toAssert = esprima.parse(assignment.getText()).body.pop();

  callExpression.arguments.push((toAssert as any).expression);

  const ast = utils.ast.getAssignmentExpression(
    name,
    utils.ast.getIdentifier(name),
    callExpression,
  );

  return ast;
}
