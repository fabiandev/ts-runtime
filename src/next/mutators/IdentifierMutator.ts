import * as ts from 'typescript';
import { Mutator } from './Mutator';
import { MutationContext } from '../context'

export class IdentifierMutator extends Mutator {

  protected kind = ts.SyntaxKind.Identifier;

  public mutate(node: ts.Identifier, context: MutationContext): ts.Node {
    // console.log(node.getText());
    // console.log(node.modifiers);
    // console.log(node.originalKeywordKind);
    // console.log(ts.NodeFlags[node.flags]);

    // const flags = ts.getCombinedModifierFlags(node);
    // console.log(flags);

    return node;
  }

}
