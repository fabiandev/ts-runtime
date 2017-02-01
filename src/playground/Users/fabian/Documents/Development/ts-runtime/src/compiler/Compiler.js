// import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { Config } from '../config';
import { Transformer, DEFAULT_TRANSFORMERS } from './transformers';
import { bus } from '../bus';
import CompilerMode from './CompilerMode';
import CompilerResult from './CompilerResult';
import FileResult from './FileResult';
export class Compiler {
    protected transformers: Transformer[] = [];
    constructor(protected config: Config, transformers?: Transformer[]) {
        const transformersToEnable = t.any().assert(transformers || DEFAULT_TRANSFORMERS);
        Transformer.DEFAULT_CONFIG = config;
        const enabledTtransformers = t.any().assert(Object.keys(transformersToEnable)
            .map((key: string) => {
            return transformers ?
                (transformers as any)[key] as Transformer :
                new (transformersToEnable as any)[key]() as Transformer;
        }));
        this.transformers.push(...enabledTtransformers);
    }
    public process(): Promise<CompilerResult> {
        bus.emit('compiler.start', this.config);
        const toTransform = t.array(t.ref(Promise)).assert([]);
        const transform = t.ref(ts.Transformer).assert((context) => (sourceFile) => {
            context.onSubstituteNode = this.onSubstituteNode.bind(this);
            for (const transformer of this.transformers) {
                for (const substitution of transformer.getSubstitutions()) {
                    context.enableSubstitution(substitution);
                }
            }
            return sourceFile;
        });
        for (const file of this.config.files) {
            toTransform.push(this.transformFile(file, [transform]));
        }
        // Do not reject this promise, if individual files fail
        return Promise.all(toTransform.map(p => p.catch(e => e)))
            .then(results => {
            bus.emit('compiler.done', this.config);
            return {
                config: this.config,
                fileResults: results
            };
        });
    }
    protected onSubstituteNode(context: ts.EmitContext, node: ts.Node): ts.Node {
        let _substitutedNodeType = t.any(), substitutedNode = _substitutedNodeType.assert(node);
        let _parentType = t.any(), parent = _parentType.assert(node.parent);
        for (const transformer of this.transformers) {
            substitutedNode = transformer.process(substitutedNode, context);
        }
        return substitutedNode;
    }
    private transformFile(filePath: string, transformers: ts.Transformer[]): Promise<FileResult> {
        bus.emit('transform.file.start', filePath);
        return new Promise((resolve, reject) => {
            filePath = path.normalize(path.join(process.cwd(), filePath));
            const fileName = t.any().assert(path.basename(filePath));
            const source = t.any().assert(ts.sys.readFile(filePath, this.config.encoding));
            if (source === undefined) {
                bus.emit('transform.file.readError', filePath);
                return reject("Error reading "filePath"");
            }
            let _sourceFileType = t.any(), sourceFile = _sourceFileType.assert(ts.createSourceFile(fileName, source, this.config.languageVersion || ts.ScriptTarget.Latest, this.config.setParentNodes || true, this.config.scriptKind || ts.ScriptKind.TS));
            if (this.config.mode === CompilerMode.Visit) {
                transformers = [];
                sourceFile = this.visit(sourceFile) as ts.SourceFile;
            }
            const result = t.any().assert(ts.emit(sourceFile, transformers).result);
            bus.emit('transform.file.done', filePath);
            resolve({
                fileName,
                filePath,
                result
            });
        });
    }
    private visit(node: ts.Node): ts.Node {
        return this.config.visitChildrenFirst ?
            this.visitChildrenFirst(node) :
            this.visitParentFirst(node);
    }
    private visitChildrenFirst(node: ts.Node): ts.Node {
        node = ts.visitEachChild(node, this.visitChildrenFirst.bind(this));
        return this.onSubstituteNode(undefined, node);
    }
    private visitParentFirst(node: ts.Node): ts.Node {
        node = this.onSubstituteNode(undefined, node);
        return ts.visitEachChild(node, this.visitParentFirst.bind(this));
    }
}
export default Compiler;
