// function firstPassVisitor(node: ts.Node, mc: MutationContext, tc: ts.TransformationContext): void {
//   if (!node) return;
//   let checker = program.getTypeChecker();
//   ts.forEachChild(node, n => {
//
//
//     // let type = checker.getTypeAtLocation(n);
//     // // console.log('TYPE', type);
//     // let typeString = checker.typeToString(type);
//     // console.log('TYPESTRING', typeString);
//     // let source = `let temp: ${typeString};`;
//     // console.log('SRC', source);
//     // console.log('\n\n\n');
//     // let sf = ts.createSourceFile('temp', source, ts.ScriptTarget.ES2015);
//     // let typeNode = (sf.statements[0] as ts.VariableStatement).declarationList.declarations[0].type;
//
//     switch (n.kind) {
//       case ts.SyntaxKind.BinaryExpression:
//         // console.log((n as ts.BinaryExpression).getText());
//         // let s = program.getTypeChecker().getSymbolAtLocation(n);
//         // let t = program.getTypeChecker().getContextualType(n as ts.BinaryExpression);
//         // console.log(s);
//         // console.log(t);
//         // console.log('\n\n');
//         break;
//       case ts.SyntaxKind.Identifier:
//         console.log((n as ts.Identifier).text);
//         console.log('-----------------------');
//
//
//
//         // let t = checker.getTypeAtLocation(n);
//         // // console.log(checker.getPropertiesOfType(t));
//         // // t = checker.getWidenedType(t);
//         // //
//         // console.log(ts.TypeFlags[t.flags]);
//
//         let type = checker.getTypeAtLocation(n);
//
//         let typeString = checker.typeToString(type);
//         console.log(typeString);
//         let source = `let temp: ${typeString};`;
//
//         let sf = ts.createSourceFile('temp', source, ts.ScriptTarget.ES2015);
//         let typeNode = (sf.statements[0] as ts.VariableStatement).declarationList.declarations[0].type;
//
//         //
//         // let asm = type.aliasSymbol;
//         //
//         // if (asm) {
//         //   if (asm.declarations && asm.declarations[0]) {
//         //     console.log(asm.declarations.length);
//         //     let asmi = asm.declarations[0] as ts.VariableDeclaration;
//         //     if (asmi.type) {
//         //       console.log('has type');
//         //       console.log(ts.SyntaxKind[asmi.type.kind]);
//         //     }
//         //   }
//         // }
//         //
//         console.log(ts.TypeFlags[type.flags]);
//         console.log('\n\n');
//
//         // console.log('KIND:', (n as ts.Identifier).text);
//         // console.log((n as ts.Identifier).originalKeywordKind);
//         // console.log('');
//
//         // if (mc.names.indexOf((n as ts.Identifier).text) === -1) {
//         //   // mc.names.push((n as ts.Identifier).text);
//         //   // console.log('KIND:', (n as ts.Identifier).text);
//         //   // console.log((n as ts.Identifier).originalKeywordKind);
//         //   // console.log('');
//         // }
//         break;
//       case ts.SyntaxKind.VariableDeclaration:
//         // const dec = n as ts.VariableDeclaration;
//         // if (dec.name.kind === ts.SyntaxKind.Identifier) {
//         //   mc.declarations.set((dec.name as ts.Identifier).text, dec.type);
//         // }
//         break;
//     }
//
//     firstPassVisitor(n, mc, tc);
//   });
// }
