import * as path from 'path';
import * as ts from 'typescript';
import * as util from '../util';
import { Mutator } from './Mutator';

export class SourceFileMutator extends Mutator {

  protected kind = ts.SyntaxKind.SourceFile;

  protected mutate(node: ts.SourceFile): ts.SourceFile {
    const statements = util.asNewArray(node.statements);

    const declarations: ts.Statement[] = [];

    if (this.context.isEntryFile(node)) {
      declarations.push(this.factory.importDeclarationsStatement());
    }

    declarations.push(this.factory.importLibStatement());

    statements.unshift(...declarations);

    return this.map(node, ts.updateSourceFileNode(node, statements));
  }

}
