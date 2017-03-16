import * as ts from 'typescript';

const input = `
const fun = () => {
 const another: boolean = true;
}
`;

const file = ts.createSourceFile('test.ts', input, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const file1 = visit(file) as ts.SourceFile;

console.log(ts.emit(file1).result);

function visit(node: ts.Node): ts.Node {
  // if (node.kind === ts.SyntaxKind.Identifier && (node as ts.Identifier).text === 'undefined') {
  //     return ts.factory.createVoidZero();
  // }
  // return ts.visitEachChild(node, visit);
  //
  if (node.getChildCount() > 0) {
    ts.visitEachChild(node, visit);
  }

  console.log('-->\n', node.getText(), '\n<--');
  console.log('');

  if (node.kind === ts.SyntaxKind.Identifier && (node as ts.Identifier).text === 'undefined') {
    return ts.factory.createVoidZero();
  } else {
    return node;
  }

}


// const transform: ts.Transformer = (context) => (f) => {
//     context.enableSubstitution(ts.SyntaxKind.VariableDeclaration);
//     context.onSubstituteNode = (emitContext, node) => {
//         if (node.kind === ts.SyntaxKind.VariableDeclaration) {
//             let n = node as ts.VariableDeclaration;
//             let dec = n as any;
//
//             const name = n.name.getText();
//
//             if (n.type === undefined) {
//               return n;
//             }
//
//             console.log(n.type.getText());
//             // if (n.type !== undefined) {
//             //   dec = ts.factory.createVariableDeclarationList([
//             //     ts.factory.createVariableDeclaration(
//             //       `_${name}Type`,
//             //     ),
//             //     n,
//             //   ]);
//             // }
//             return ts.factory.createVariableDeclaration(
//               `_${name}Type`,
//             );
//         }
//     };
//     return f;
// };
//
// console.log(ts.emit(file, [transform]).result);
