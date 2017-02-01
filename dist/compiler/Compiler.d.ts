import * as ts from 'typescript';
import { Config } from '../config';
import { Transformer } from './transformers';
import CompilerResult from './CompilerResult';
export declare class Compiler {
    protected config: Config;
    protected transformers: Transformer[];
    constructor(config: Config, transformers?: Transformer[]);
    process(): Promise<CompilerResult>;
    protected onSubstituteNode(context: ts.EmitContext, node: ts.Node): ts.Node;
    private transformFile(filePath, transformers);
    private visit(node);
    private visitChildrenFirst(node);
    private visitParentFirst(node);
}
export default Compiler;
