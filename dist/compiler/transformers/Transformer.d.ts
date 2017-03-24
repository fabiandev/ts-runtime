import * as ts from 'typescript';
import { Config } from '../../config';
export declare abstract class Transformer {
    static DEFAULT_CONFIG: Config;
    protected config: Config;
    protected visited: ts.Node[];
    protected abstract substitution: ts.SyntaxKind | ts.SyntaxKind[];
    protected abstract transform(node: ts.Node, context?: ts.EmitContext): ts.Node;
    constructor(config?: Config);
    getSubstitutions(): ts.SyntaxKind[];
    getVisited(): ts.Node[];
    process(node: ts.Node, context?: ts.EmitContext): ts.Node;
    protected wasGenerated(node: ts.Node): boolean;
    protected wasVisited(node: ts.Node): boolean;
}
export default Transformer;
