import * as escodegen from 'escodegen';

export function toString(ast: any): string {
  return escodegen.generate(ast);
}

export function getVariableDeclaration(kind: string = 'let'): any {
  return {
    type: 'VariableDeclaration',
    kind: kind,
    declarations: [],
  };
}

export function getVariableDeclarator(varName: string): any {
  return {
    type: 'VariableDeclarator',
    id: {
      type: 'Identifier',
      name: varName,
    },
  };
}

export function getCallExpression(typeName: string, id: string = 't'): any {
  return {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: {
        type: 'Identifier',
        name: id,
      },
      property: {
        type: 'Identifier',
        name: typeName,
      },
    },
    arguments: [],
  };
}

export function getAssignmentExpression(name: string, left: any, right: any, operator: string = '='): any {
  return {
    type: 'AssignmentExpression',
    operator: operator,
    left: left,
    right: right,
  };
}

export function getIdentifier(name: string): any {
  return {
    type: 'Identifier',
    name: name,
  };
}
