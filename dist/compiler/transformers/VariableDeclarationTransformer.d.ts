import * as ts from 'typescript';
import { Transformer } from './Transformer';
export declare class VariableDeclarationTransformer extends Transformer {
    protected substitution: ts.SyntaxKind;
    protected transform(node: ts.VariableDeclarationList): ts.Node;
    private transformDeclaration(node);
    private transformLetDeclaration(node);
    private transformConstDeclaration(node);
    private transformUntypedLetDeclaration(node);
    private transformUntypedConstDeclaration(node);
}
export default VariableDeclarationTransformer;
