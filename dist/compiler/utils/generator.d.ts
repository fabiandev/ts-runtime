import * as ts from 'typescript';
export declare function createTypeDefinition(type: ts.TypeNode | string, name: string): ts.VariableDeclaration;
export declare function createTypeCalls(type: ts.TypeNode | string): ts.CallExpression;
export declare function createTypeCall(id: string, prop: string, args?: ts.Expression[], types?: ts.TypeNode[]): ts.CallExpression;
