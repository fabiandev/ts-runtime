import * as ts from 'typescript';
import { Transformer } from './Transformer';
export declare class FunctionDeclarationTransformer extends Transformer {
    protected substitution: ts.SyntaxKind;
    protected transform(node: ts.FunctionDeclaration, context: ts.EmitContext): ts.Node;
}
export default FunctionDeclarationTransformer;
