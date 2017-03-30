import * as path from 'path';
import * as ts from 'typescript';
import * as tsr from '../';

const program = ts.createProgram([path.join(__dirname, './gettype.ts')], {});
const checker = program.getTypeChecker();
const nodes = program.getSourceFiles().filter(sf => !sf.isDeclarationFile)[0].statements;
const sf = program.getSourceFiles().filter(sf => !sf.isDeclarationFile)[0];

const firstDeclarations = (nodes as any)[0].declarationList.declarations;

ts.forEachChild(sf, visit);

function visit(node: ts.Node) {
  console.log(ts.SyntaxKind[node.kind]);
  console.log(node.getText());
  try {
    console.log(checker.typeToString(checker.getTypeAtLocation(node)));
    console.log();
    ts.forEachChild(node, visit);
  } catch (e) {
    console.log('EXCEPTION');
    console.log();
  }
}

// for (let node of nodes) {
//   for (let n of (node as any).declarationList.declarations)
//   console.log(node.getText());
//   console.log(checker.typeToString(checker.getTypeAtLocation(node.name)));
//   console.log();
// }
