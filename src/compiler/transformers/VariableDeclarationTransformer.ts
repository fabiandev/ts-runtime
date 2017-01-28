import * as ts from 'typescript/built/local/typescript';
import * as tsc from 'typescript';
import { Transformer } from './Transformer';

export class VariableDeclarationTransformer extends Transformer {

  protected substitution = ts.SyntaxKind.VariableDeclaration;

  public onSubstituteNode(context: ts.EmitContext, node: ts.Node): ts.Node {
    return ts.factory.createVariableDeclaration(
      '_xType',
      undefined,
      ts.factory.createPropertyAccess(ts.factory.createIdentifier('t'), 'number'),
    );
  }

}

export default VariableDeclarationTransformer;
