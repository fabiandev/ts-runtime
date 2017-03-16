import * as ts from 'typescript';

export function transformer(context: ts.TransformationContext):
  ts.Transformer<ts.SourceFile> {
  const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
    switch (node.kind) {
      case ts.SyntaxKind.Decorator:
        // drop on the floor;
        return null as any;
      default:
        return ts.visitEachChild(node, visitor, context);
    }
  };

  const transformer: ts.Transformer<ts.SourceFile> = (sf: ts.SourceFile) =>
    ts.visitNode(sf, visitor);

  return transformer;
}
