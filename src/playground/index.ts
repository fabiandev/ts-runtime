import * as ts from '../../../../../Local/TypeScript/built/local/typescript';

const input = `
function foo(x) {
  if (x === undefined) {
    x = 2;
  }

  return x * 3;
}
`;

const file = ts.createSourceFile('test.ts', input, ts.ScriptTarget.Latest, true);

const file1 = visit(file) as ts.SourceFile;

console.log(ts.emit(file1).result);

function visit(node: ts.Node): ts.Node {
    if (node.kind === ts.SyntaxKind.Identifier && (node as ts.Identifier).text === 'undefined') {
        return ts.factory.createVoidZero();
    }
    return ts.visitEachChild(node, visit);
}

const transform: ts.Transformer = context => f => {
    context.enableSubstitution(ts.SyntaxKind.Identifier);
    context.onSubstituteNode = (emitContext, node) => {
        if (node.kind === ts.SyntaxKind.Identifier && (node as ts.Identifier).text === 'undefined') {
            return ts.factory.createVoidZero();
        }
    };
    return f;
};

console.log(ts.emit(file, [transform]).result);
