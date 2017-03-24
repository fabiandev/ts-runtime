import * as ts from 'typescript';
import Transformer from './Transformer';
export declare class HasStatementsTransformer extends Transformer {
    protected substitution: ts.SyntaxKind[];
    protected transform(node: ts.SourceFile | ts.Block | ts.ModuleBlock | ts.CaseClause | ts.DefaultClause): ts.Node;
    private createFunctionAnnotation(node);
}
export default HasStatementsTransformer;
