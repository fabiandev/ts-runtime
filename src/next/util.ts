import * as ts from 'typescript';

export function setParent(node: ts.Node): void {
  if (!node) return;
  ts.forEachChild(node, n => {
    n.parent = node;
    setParent(n);
  });
}

export function getScope(node: ts.Node): ts.Node {
  if (node.kind === ts.SyntaxKind.SourceFile) {
    return node;
  }

  if (this.isScope(node.kind)) {
    return node;
  }

  return this.getScope(node.parent);
}

export function isScope(kind: ts.SyntaxKind): boolean {
  switch (kind) {
    case ts.SyntaxKind.SourceFile:
    case ts.SyntaxKind.Block:
    case ts.SyntaxKind.ModuleBlock:
    case ts.SyntaxKind.CaseBlock:
      return true;
    default:
      return false;
  }
}

export function isKind(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return node.kind === kind;
}
