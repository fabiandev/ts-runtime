import * as ts from 'typescript';

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

export function setParent(node: ts.Node): void {
  if (!node) return;
  ts.forEachChild(node, n => {
    n.parent = node;
    setParent(n);
  });
}

export function getHash(str: string): number {
  var hash = 5381, i = str.length;

  while(i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }

  return hash >>> 0;
  // return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
}

export function getIdentifierOfQualifiedName(node: ts.EntityName): ts.Identifier {
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

export function hasKind(node: ts.Node, kind: ts.SyntaxKind): boolean {
  if (!node) {
    return false;
  }

  if (node.kind === kind) {
    return true;
  }

  return ts.forEachChild(node, n => hasKind(n, kind)) || false;
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

export function getImplementsClause(node: ts.InterfaceDeclaration | ts.ClassDeclaration): ts.HeritageClause {
  return node.heritageClauses && node.heritageClauses.find(clause => {
    if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
      return true;
    }
  });
}

export function hasModifier(node: ts.Node, modifier: ts.SyntaxKind): boolean {
  for (let flag of node.modifiers || []) {
    if (flag.kind === modifier) {
      return true;
    }
  }

  return false;
}

export function extendsClauseHasTypeArguments(node: ts.HeritageClause): boolean {
  return node && node.types && node.types[0] && node.types[0].typeArguments && node.types[0].typeArguments.length > 0;
}

export function isSynthesized(node: ts.Node): boolean {
  return (node.flags & ts.NodeFlags.Synthesized) === ts.NodeFlags.Synthesized;
}

export function isAmbient(node: ts.Node): boolean {
  do {
    if (isKind(node, ...AMBIENT_KINDS)) {
      return true;
    }
  } while(node = node.parent);

  return false
}

export function getExpression(node: ts.Node): ts.Expression {
  while((node as any).expression) {
    node = (node as any).expression;
  }

  return node as ts.Expression;
}

export function isDeclaration(node: ts.Node): boolean {
  do {
    if (hasModifier(node, ts.SyntaxKind.DeclareKeyword)) {
      return true;
    }
  } while(node = node.parent);

  return false
}

export function hasFlag(node: ts.Node | ts.Symbol, flag: ts.NodeFlags | ts.SymbolFlags) {
  return !!(node.flags & flag);
}

export function isBindingPattern(node: ts.Node): boolean {
  return ts.isArrayBindingPattern(node) || ts.isObjectBindingPattern(node);
}

export function isStaticClassElement(node: ts.Node): boolean {
  return !Array.isArray(node.modifiers) ? false : node.modifiers.findIndex((el: any) => el.kind === ts.SyntaxKind.StaticKeyword) !== -1;
}

export function getTypeNameText(node: ts.EntityName): string {
  if (ts.isIdentifier(node)) {
    return node.text;
  }

  const left = getTypeNameText(node.left)
  const right = node.right.text;

  return `${left}.${right}`;
}

export function isTypeParameter(node: ts.TypeReferenceNode): boolean {
  const nodeName = getTypeNameText(node.typeName);

  while(node = node.parent as any) {
    if ((node as any).typeParameters && (node as any).typeParameters.length > 0) {
      if ((node as any).typeParameters.find((param: ts.TypeParameterDeclaration) => {
        return param.name.getText() === nodeName;
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

  const nodeName = getTypeNameText(node.typeName);

  for (let typeParameter of typeParameters) {

    if (typeParameter.name.getText() === nodeName) {
      return true;
    }
  }

  return false;
}

export function isTypeParameterOfClass(node: ts.TypeReferenceNode): ts.ClassDeclaration {
  let current = node as ts.Node;
  while (current = current.parent) {
    if (ts.isClassDeclaration(current)) {
      if (isTypeParameterOf(node, current.typeParameters || [])) {
        return current;
      }

      return null;
    }
  }

  return null;
}

export function isSuperStatement(node: ts.Node): boolean {
  return ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) &&
    node.expression.expression.kind === ts.SyntaxKind.SuperKeyword;
}

// function isAmbientNode(node: ts.Node) {
//   return hasModifier(node, ts.SyntaxKind.DeclareKeyword) || isKind(node, ...AMBIENT_KINDS);
// }

export function isKind(node: ts.Node, ...kind: ts.SyntaxKind[]): boolean {
  return kind.indexOf(node.kind) !== -1;
}

export function isBindingName(node: ts.Node): node is ts.Identifier | ts.BindingPattern | ts.ArrayBindingPattern {
  return ts.isIdentifier(node) || this.isBindingPattern(node);
}

export function isLiteral(node: ts.Node): node is ts.LiteralTypeNode | ts.NumericLiteral | ts.StringLiteral | ts.KeywordTypeNode {
  return LITERAL_KINDS.indexOf(node.kind) !== -1;
}

export function isTypeNode(node: ts.Node): node is ts.TypeNode {
  return ts.isTypeNode(node);
  // return (node.kind >= ts.SyntaxKind.TypePredicate && node.kind <= ts.SyntaxKind.LiteralType) || node.kind === ts.SyntaxKind.ExpressionWithTypeArguments;
}

// export function getScope(node: ts.Node): ts.Node {
//   if (node.kind === ts.SyntaxKind.SourceFile) {
//     return node;
//   }
//
//   if (isScopeKind(node.kind)) {
//     return node;
//   }
//
//   return getScope(node.parent);
// }
//
//
// // TODO: test
// export function identifierExistsUp(node: ts.Node, id: string | ts.Identifier) {
//   if (typeof id !== 'string') id = id.text;
//   let current = node;
//   while (current.parent) current = current.parent;
//   return identifierExistsDown(current, id, node);
// }
//
// // TODO: test
// export function identifierExistsDown(node: ts.Node, id: string, stop?: ts.Node): boolean {
//   if (!node || node === stop) return false;
//   return node.kind === ts.SyntaxKind.Identifier && (node as ts.Identifier).text === id ?
//     true : !!ts.forEachChild(node, n => identifierExistsDown(n, id, stop));
// }
//
// export function isScopeKind(kind: ts.SyntaxKind): boolean {
//   switch (kind) {
//     case ts.SyntaxKind.SourceFile:
//     case ts.SyntaxKind.Block:
//     case ts.SyntaxKind.ModuleBlock:
//     case ts.SyntaxKind.CaseBlock:
//       return true;
//     default:
//       return false;
//   }
// }
