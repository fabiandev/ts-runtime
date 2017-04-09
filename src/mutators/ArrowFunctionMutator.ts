import * as ts from 'typescript';
import { Mutator } from './Mutator';

export class ArrowFunctionMutator extends Mutator {

  protected kind = ts.SyntaxKind.ArrowFunction;

  // TODO: implement
  protected mutate(node: ts.ArrowFunction): ts.ArrowFunction {
    return node;
  }

}
