import * as ts from 'typescript';
import { Mutator } from './Mutator';
import { MutationContext } from '../context'

export class ImportSpecifierMutator extends Mutator {

  protected kind = ts.SyntaxKind.ImportSpecifier;

  public mutate(node: ts.ImportSpecifier, context: MutationContext): ts.Node {
    // const flags = ts.getCombinedModifierFlags(node);
    // console.log(flags);
    return node;
  }

}
