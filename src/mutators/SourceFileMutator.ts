import * as path from 'path';
import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

export class SourceFileMutator extends Mutator {

  protected kind = ts.SyntaxKind.SourceFile;

  protected mutate(node: ts.SourceFile): ts.SourceFile {
    const statements = util.asNewArray(node.statements);
    const declarations: ts.Statement[] = [];

    if (this.options.moduleAlias) {
      declarations.push(ts.createImportDeclaration(
        undefined, undefined, undefined,
        ts.createLiteral('module-alias/register')
      ));
    }

    if (!this.options.excludeDeclarationFile && this.context.scanner.getDeclarations().length > 0 && this.context.isEntryFile(node.fileName)) {
      // TODO: refactor to not use path module
      const relativePath = path.relative(path.dirname(node.fileName), this.context.commonDir);
      const filePath = path.join(relativePath, this.context.options.declarationFileName);
      const prefix = !relativePath ? './' : '';

      declarations.push(ts.createImportDeclaration(
        undefined, undefined, undefined,
        ts.createLiteral(`${prefix}${filePath}`)
      ));
    }

    if (!this.options.excludeLib) {
      declarations.push(this.factory.importLibStatement());
    }

    statements.unshift(...declarations);

    return declarations.length > 0 ? ts.updateSourceFileNode(node, statements) : node;
  }

}
