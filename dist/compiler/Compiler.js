"use strict";
// import * as fs from 'fs';
const path = require("path");
const ts = require("typescript");
const transformers_1 = require("./transformers");
const bus_1 = require("../bus");
const CompilerMode_1 = require("./CompilerMode");
class Compiler {
    constructor(config, transformers) {
        this.config = config;
        this.transformers = [];
        const transformersToEnable = transformers || transformers_1.DEFAULT_TRANSFORMERS;
        transformers_1.Transformer.DEFAULT_CONFIG = config;
        const enabledTtransformers = Object.keys(transformersToEnable)
            .map((key) => {
            return transformers ?
                transformers[key] :
                new transformersToEnable[key]();
        });
        this.transformers.push(...enabledTtransformers);
    }
    process() {
        bus_1.bus.emit('compiler.start', this.config);
        const toTransform = [];
        const transform = (context) => (sourceFile) => {
            context.onSubstituteNode = this.onSubstituteNode.bind(this);
            for (const transformer of this.transformers) {
                for (const substitution of transformer.getSubstitutions()) {
                    context.enableSubstitution(substitution);
                }
            }
            return sourceFile;
        };
        for (const file of this.config.files) {
            toTransform.push(this.transformFile(file, [transform]));
        }
        // Do not reject this promise, if individual files fail
        return Promise.all(toTransform.map(p => p.catch(e => e)))
            .then(results => {
            bus_1.bus.emit('compiler.done', this.config);
            return {
                config: this.config,
                fileResults: results,
            };
        });
    }
    onSubstituteNode(context, node) {
        let substitutedNode = node;
        let parent = node.parent;
        for (const transformer of this.transformers) {
            substitutedNode = transformer.process(substitutedNode, context);
        }
        return substitutedNode;
    }
    transformFile(filePath, transformers) {
        bus_1.bus.emit('transform.file.start', filePath);
        return new Promise((resolve, reject) => {
            filePath = path.normalize(path.join(process.cwd(), filePath));
            const fileName = path.basename(filePath);
            const source = ts.sys.readFile(filePath, this.config.encoding);
            if (source === undefined) {
                bus_1.bus.emit('transform.file.readError', filePath);
                return reject(`Error reading ${filePath}`);
            }
            let sourceFile = ts.createSourceFile(fileName, source, this.config.languageVersion || ts.ScriptTarget.Latest, this.config.setParentNodes || true, this.config.scriptKind || ts.ScriptKind.TS);
            if (this.config.mode === CompilerMode_1.default.Visit) {
                transformers = [];
                sourceFile = this.visit(sourceFile);
            }
            const result = ts.emit(sourceFile, transformers).result;
            bus_1.bus.emit('transform.file.done', filePath);
            resolve({
                fileName,
                filePath,
                result,
            });
        });
    }
    visit(node) {
        return this.config.visitChildrenFirst ?
            this.visitChildrenFirst(node) :
            this.visitParentFirst(node);
    }
    visitChildrenFirst(node) {
        node = ts.visitEachChild(node, this.visitChildrenFirst.bind(this));
        return this.onSubstituteNode(undefined, node);
    }
    visitParentFirst(node) {
        node = this.onSubstituteNode(undefined, node);
        return ts.visitEachChild(node, this.visitParentFirst.bind(this));
    }
}
exports.Compiler = Compiler;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Compiler;
