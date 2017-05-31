import * as path from 'path';
import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

export class SourceFileMutator extends Mutator {

  protected kind = ts.SyntaxKind.SourceFile;

  protected mutate(node: ts.SourceFile): ts.SourceFile {
    const statements = util.asNewArray(node.statements);

    // TODO: insert after references

    const declarations = [
      ts.createImportDeclaration(
        undefined, undefined, ts.createImportClause(
          ts.createIdentifier(this.context.factory.lib), undefined),
          ts.createLiteral(this.context.factory.package)
        )
    ];

    if (this.isEntryFile(node)) {
      declarations.push(ts.createImportDeclaration(
        undefined, undefined, undefined, ts.createLiteral(`./${this.context.options.declarationFile}`)
      ));
    }

    statements.unshift(...declarations);

    // statements.unshift(ts.createImportDeclaration(
    //   [], undefined, ts.createImportClause(
    //     undefined, ts.createNamespaceImport(ts.createIdentifier(this.context.factory.lib))
    //   ), ts.createLiteral(this.context.factory.package)
    // ));

    // const substitution = ts.updateSourceFileNode(node, statements);
    //
    // for (let referencedFile of substitution.referencedFiles || []) {
    //   console.log(referencedFile.fileName);
    //   console.log(path.isAbsolute(referencedFile.fileName))
    //   if (path.isAbsolute(referencedFile.fileName)) {
    //     continue;
    //   }
    //
    //   referencedFile.fileName = path.join(path.dirname(substitution.fileName),  referencedFile.fileName);
    //   console.log(referencedFile.fileName);
    // }
    //
    // console.log(substitution);
    //
    // return substitution;

    return ts.updateSourceFileNode(node, statements);
  }

  private isEntryFile(node: ts.SourceFile): boolean {
    console.log(node.fileName);
    console.log(this.context.entryFilePath);
    console.log()
    return node.fileName === this.context.entryFilePath;
  }

}
