"use strict";
const ts = require("typescript");
const Transformer_1 = require("./Transformer");
const utils_1 = require("../utils");
// type HasStatementsNode = ts.SourceFile | ts.Block | ts.ModuleBlock | ts.CaseClause | ts.DefaultClause;
// export { HasStatementsNode };
class HasStatementsTransformer extends Transformer_1.default {
    constructor() {
        super(...arguments);
        this.substitution = [
            ts.SyntaxKind.SourceFile,
            ts.SyntaxKind.Block,
            ts.SyntaxKind.ModuleBlock,
            ts.SyntaxKind.CaseClause,
            ts.SyntaxKind.DefaultClause,
        ];
    }
    transform(node) {
        if (!Array.isArray(node.statements)) {
            return node;
        }
        const statements = node.statements;
        let i = 0;
        for (const statement of node.statements) {
            if (statement.kind !== ts.SyntaxKind.FunctionDeclaration) {
                continue;
            }
            const annotation = this.createFunctionAnnotation(statement);
            statements.splice(++i, 0, annotation);
        }
        node.statements = statements;
        return node;
    }
    createFunctionAnnotation(node) {
        const returnType = node.type;
        const args = [];
        for (const param of node.parameters) {
            args.push(ts.factory.createCall(ts.factory.createPropertyAccess(ts.factory.createIdentifier('t'), ts.factory.createIdentifier('param')), [], [
                ts.factory.createLiteral(param.name.getText()),
                utils_1.generator.createTypeCalls(param.type),
            ]));
        }
        if (node.type !== undefined) {
            args.push(ts.factory.createCall(ts.factory.createPropertyAccess(ts.factory.createIdentifier('t'), ts.factory.createIdentifier('return')), [], [
                utils_1.generator.createTypeCalls(node.type),
            ]));
        }
        const annotation = ts.factory.createStatement(ts.factory.createCall(ts.factory.createPropertyAccess(ts.factory.createIdentifier('t'), ts.factory.createIdentifier('annotate')), [], [
            ts.factory.createIdentifier(node.name.getText()),
            ts.factory.createCall(ts.factory.createPropertyAccess(ts.factory.createIdentifier('t'), ts.factory.createIdentifier('function')), [], args),
        ]));
        return annotation;
    }
}
exports.HasStatementsTransformer = HasStatementsTransformer;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HasStatementsTransformer;
