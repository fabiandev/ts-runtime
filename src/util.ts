import * as ts from 'typescript';
import { ProgramError } from './errors';

export const LITERAL_KINDS = [
  ts.SyntaxKind.LiteralType,
  ts.SyntaxKind.NumericLiteral,
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.TrueKeyword,
  ts.SyntaxKind.FalseKeyword
];

export const AMBIENT_KINDS = [
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.TypeAliasDeclaration,
];

export function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : !value ? [] : [value];
}

export function asNewArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value.length > 0 ? [...value] : [] : !value ? [] : [value];
}

export function arrayFromNodeArray<T extends ts.Node>(value: ts.NodeArray<T>) {
  return !value ? [] : [...value];
}

export function hasTypeParameters(node: ts.Node): boolean {
  return Array.isArray((node as any).typeParameters) && (node as any).typeParameters.length > 0;
}

export function hasProperty(obj: any, prop: string): boolean {
  return obj && obj.hasOwnProperty(prop);
}

export function hasArrayProperty(obj: any, prop: string): boolean {
  return hasProperty(obj, prop) && Array.isArray(obj[prop]);
}

export function hasNonEmptyArrayProperty(obj: any, prop: string): boolean {
  return hasArrayProperty(obj, prop) && obj[prop].length > 0;
}

export function hasKind(node: ts.Node, kind: ts.SyntaxKind): boolean {
  if (!node) {
    return false;
  }

  if (node.kind === kind) {
    return true;
  }

  return ts.forEachChild(node, n => hasKind(n, kind)) || false;
}

export function hasModifier(node: ts.Node, modifier: ts.SyntaxKind): boolean {
  for (let flag of node.modifiers || []) {
    if (flag.kind === modifier) {
      return true;
    }
  }

  return false;
}

export function hasFlag(node: ts.Node | ts.Symbol, flag: ts.NodeFlags | ts.SymbolFlags) {
  return !!(node.flags & flag);
}

export function setParent(node: ts.Node): ts.Node {
  if (!node) return node;

  ts.forEachChild(node, n => {
    // TODO: fix any cast
    (n.parent as any) = node;
    setParent(n);
  });

  return node;
}

export function isAnyKeyword(node: ts.Node): boolean {
  if (!node) {
    return false;
  }

  if (node.kind === ts.SyntaxKind.AnyKeyword) {
    return true;
  }

  return false;
}

export function isSynthesized(node: ts.Node): boolean {
  return (node.flags & ts.NodeFlags.Synthesized) === ts.NodeFlags.Synthesized;
}

export function isAmbient(node: ts.Node): boolean {
  do {
    if (isKind(node, ...AMBIENT_KINDS)) {
      return true;
    }
  } while (node = node.parent);

  return false
}

export function isAmbientDeclaration(node: ts.Node): boolean {
  do {
    if (hasModifier(node, ts.SyntaxKind.DeclareKeyword)) {
      return true;
    }
  } while (node = node.parent);

  return false;
}

export function isPartOfTypeNode(node: ts.Node) {
  while (node && node.parent) {
    if (ts.isTypeNode(node)) {
      return true;
    }

    node = node.parent;
  }

  return false;
}

export function isBindingPattern(node: ts.Node): node is ts.BindingPattern {
  return ts.isArrayBindingPattern(node) || ts.isObjectBindingPattern(node);
}

export function isStatic(node: ts.Node): boolean {
  return !Array.isArray(node.modifiers) ? false : node.modifiers.findIndex((el: any) => el.kind === ts.SyntaxKind.StaticKeyword) !== -1;
}

export function isTypeParameter(node: ts.TypeReferenceNode): boolean {
  const nodeName = getEntityNameText(node.typeName);

  while (node = node.parent as any) {
    if ((node as any).typeParameters && (node as any).typeParameters.length > 0) {
      if ((node as any).typeParameters.find((param: ts.TypeParameterDeclaration) => {
        return param.name.text === nodeName;
      })) {
        return true;
      }
    }
  }

  return false;
}

export function isTypeParameterOf(node: ts.TypeNode, typeParameters: ts.TypeParameterDeclaration[]) {
  if (!ts.isTypeReferenceNode(node)) {
    return false;
  }

  const nodeName = getEntityNameText(node.typeName);

  for (let typeParameter of typeParameters) {

    if (typeParameter.name.text === nodeName) {
      return true;
    }
  }

  return false;
}

export function isTypeParameterOfClass(node: ts.TypeReferenceNode): ts.ClassDeclaration {
  let current = node as ts.Node;
  while (current = current.parent) {
    if (ts.isClassDeclaration(current)) {
      if (isTypeParameterOf(node, arrayFromNodeArray(current.typeParameters))) {
        return current;
      }

      return null;
    }
  }

  return null;
}

export function isInStaticContext(node: ts.TypeReferenceNode): boolean {
  let current = node as ts.Node;
  while (current = current.parent) {
    if (isStatic(current)) {
      return true;
    }
  }

  return false;
}

export function isSuperStatement(node: ts.Node): boolean {
  return ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) &&
    node.expression.expression.kind === ts.SyntaxKind.SuperKeyword;
}

export function isKind(node: ts.Node, ...kind: ts.SyntaxKind[]): boolean {
  return kind.indexOf(node.kind) !== -1;
}

export function isBindingName(node: ts.Node): node is ts.Identifier | ts.BindingPattern | ts.ArrayBindingPattern {
  return ts.isIdentifier(node) || this.isBindingPattern(node);
}

export function isLiteral(node: ts.Node): node is ts.LiteralTypeNode | ts.NumericLiteral | ts.BooleanLiteral | ts.StringLiteral {
  return LITERAL_KINDS.indexOf(node.kind) !== -1;
}

export function getHash(str: string): number {
  var hash = 5381, i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }

  return hash >>> 0;
}

export function getHashedDeclarationName(name: string, fileName: string) {
  return `${name}.${getHash(fileName)}`;
}

export function getIdentifierOfEntityName(node: ts.EntityName): ts.Identifier {
  if (ts.isIdentifier(node)) {
    return node;
  }

  return node.right;
}

export function getBaseIdentifierOfEntityName(node: ts.EntityName): ts.Identifier {
  while (ts.isQualifiedName(node)) {
    node = node.left;
  }

  return node;
}

export function getExtendsClause(node: ts.InterfaceDeclaration | ts.ClassDeclaration): ts.HeritageClause {
  return node.heritageClauses && node.heritageClauses.find(clause => {
    if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
      return true;
    }
  });
}

export function getImplementsClause(node: ts.InterfaceDeclaration | ts.ClassDeclaration): ts.HeritageClause {
  return node.heritageClauses && node.heritageClauses.find(clause => {
    if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
      return true;
    }
  });
}

export function getExpression(node: ts.Node): ts.Expression {
  while ((node as any).expression) {
    node = (node as any).expression;
  }

  return node as ts.Expression;
}

export function getPropertyAccessExpressionTextOrFail(node: ts.PropertyAccessExpression): string {
  let text = '';

  while (ts.isPropertyAccessExpression(node)) {
    text += `.${node.name.text}`;
    node = node.expression as ts.PropertyAccessExpression;
  }

  if ((node as ts.Node).kind !== ts.SyntaxKind.Identifier) {
    throw new ProgramError('Can\'t get text of property access expression that contains other expressions than property access expression.');
  }

  text = `${(node as ts.Identifier).text}${text}`;

  return text;
}

export function getIdentifierOfPropertyAccessExpressionOrFail(node: ts.PropertyAccessExpression): ts.Identifier {
  let expression = node.expression;

  while (expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
    expression = (expression as ts.PropertyAccessExpression).expression;
  }

  if (expression.kind !== ts.SyntaxKind.Identifier) {
    throw new ProgramError('Can\'t get identifier of property access expression that contains other expressions than property access expression.');
  }

  return expression as ts.Identifier;
}

export function getEntityNameText(node: ts.EntityName): string {
  if (ts.isIdentifier(node)) {
    return node.text;
  }

  const left = getEntityNameText(node.left)
  const right = node.right.text;

  return `${left}.${right}`;
}

export function insertBeforeSuper(statements: ts.Statement[], insert: ts.Statement | ts.Statement[], offset = 0): ts.Statement[] {
  const index = statements.findIndex(statement => isSuperStatement(statement));

  insert = asArray(insert);

  if (index !== -1) {
    statements.splice(index + offset, 0, ...insert)
  } else {
    statements.unshift(...insert);
    // statements.splice(statements.length, 0, ...insert);
  }

  return statements;
}

export function insertAfterSuper(statements: ts.Statement[], insert: ts.Statement | ts.Statement[], offset = 0): ts.Statement[] {
  return this.insertBeforeSuper(statements, insert, 1);
}

export function declarationCanHaveTypeAnnotation(node: ts.Node) {
  let current: ts.Node = node;

  if (ts.isVariableDeclaration(current) && current.parent) {
    current = current.parent;
  }

  if (ts.isVariableDeclarationList(current) && current.parent) {
    current = current.parent;
  }

  switch (current.kind) {
    case ts.SyntaxKind.ForOfStatement:
    case ts.SyntaxKind.ForInStatement:
    case ts.SyntaxKind.CatchClause:
    case ts.SyntaxKind.ImportClause:
      return false;
  }

  return true;
}

export function extendsClauseHasTypeArguments(node: ts.HeritageClause): boolean {
  return node && node.types && node.types[0] && node.types[0].typeArguments && node.types[0].typeArguments.length > 0;
}

export function canHaveType(node: any): node is { type: ts.TypeNode } {
  if (!node) {
    return false;
  }

  switch (node.kind) {
    case ts.SyntaxKind.VariableDeclaration:
    case ts.SyntaxKind.ObjectBindingPattern:
    case ts.SyntaxKind.ArrayBindingPattern:
    case ts.SyntaxKind.Parameter:
    case ts.SyntaxKind.PropertySignature:
    case ts.SyntaxKind.PropertyDeclaration:
    case ts.SyntaxKind.MethodSignature:
    case ts.SyntaxKind.CallSignature:
    case ts.SyntaxKind.ConstructSignature:
    case ts.SyntaxKind.IndexSignature:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.FunctionDeclaration:
      return true;
  }

  return false;
}

export function annotateWithAny(node: ts.Node): boolean {
  switch (node.kind) {
    case ts.SyntaxKind.VariableDeclaration:
      if (!declarationCanHaveTypeAnnotation(node)) {
        return false;
      }
    case ts.SyntaxKind.ObjectBindingPattern:
    case ts.SyntaxKind.ArrayBindingPattern:
    case ts.SyntaxKind.Parameter:
    case ts.SyntaxKind.PropertySignature:
    case ts.SyntaxKind.PropertyDeclaration:
    case ts.SyntaxKind.MethodSignature:
    case ts.SyntaxKind.CallSignature:
    case ts.SyntaxKind.ConstructSignature:
    case ts.SyntaxKind.IndexSignature:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.FunctionDeclaration:
      (node as any).type = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
      (node as any).type.parent = node;
      return true;
  }

  return false;
}
