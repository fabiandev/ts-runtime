import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

export class SourceFileMutator extends Mutator {

  protected kind = ts.SyntaxKind.SourceFile;

  protected mutate(node: ts.SourceFile): ts.SourceFile {
    const statements = util.asNewArray(node.statements);

    statements.unshift(ts.createImportDeclaration(
      undefined, undefined, ts.createImportClause(
        ts.createIdentifier(this.context.factory.lib), undefined),
        ts.createLiteral(this.context.factory.package)
      )
    );

    // statements.unshift(ts.createImportDeclaration(
    //   [], undefined, ts.createImportClause(
    //     undefined, ts.createNamespaceImport(ts.createIdentifier(this.context.factory.lib))
    //   ), ts.createLiteral(this.context.factory.package)
    // ));

    return ts.updateSourceFileNode(node, statements);
  }

}
