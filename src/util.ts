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
  return Array.isArray(value) ? value.length > 1 ? [...value] : [] : !value ? [] : [value];
}

export function setParent(node: ts.Node): void {
  if (!node) return;
  ts.forEachChild(node, n => {
    n.parent = node;
    setParent(n);
  });
}

export function getIdentifierOfQualifiedName(node: ts.Node): ts.Node {
  while (node.kind === ts.SyntaxKind.QualifiedName) {
    node = (node as ts.QualifiedName).left;
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

export function hasModifier(node: ts.Node, modifier: ts.SyntaxKind): boolean {
  for (let flag of node.modifiers || []) {
    if (flag.kind === modifier) {
      return true;
    }
  }

  return false;
}

export function isAmbient(node: ts.Node): boolean {
  do {
    if (isKind(node, ...AMBIENT_KINDS)) {
      return true;
    }
  } while(node = node.parent);

  return false
}

export function isDeclaration(node: ts.Node): boolean {
  do {
    if (hasModifier(node, ts.SyntaxKind.DeclareKeyword)) {
      return true;
    }
  } while(node = node.parent);

  return false
}

export function isStaticClassElement(node: ts.ClassElement): boolean {
  return !node.modifiers ? false : node.modifiers.findIndex((el: any) => el.kind === ts.SyntaxKind.StaticKeyword) !== -1;
}

// function isAmbientNode(node: ts.Node) {
//   return hasModifier(node, ts.SyntaxKind.DeclareKeyword) || isKind(node, ...AMBIENT_KINDS);
// }

export function isKind(node: ts.Node, ...kind: ts.SyntaxKind[]): boolean {
  return kind.indexOf(node.kind) !== -1;
}

export function isBindingName(node: ts.Node) {
  return isKind(node, ts.SyntaxKind.Identifier, ts.SyntaxKind.ArrayBindingPattern, ts.SyntaxKind.ObjectBindingPattern);
}

export function isLiteral(node: ts.Node) {
  return LITERAL_KINDS.indexOf(node.kind) !== -1;
}

export function isTypeNode(node: ts.Node): boolean {
  return node.kind >= ts.SyntaxKind.TypePredicate && node.kind <= ts.SyntaxKind.LiteralType;
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
