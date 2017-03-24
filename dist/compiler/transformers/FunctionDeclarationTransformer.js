"use strict";
const ts = require("typescript");
const Transformer_1 = require("./Transformer");
const utils_1 = require("../utils");
class FunctionDeclarationTransformer extends Transformer_1.Transformer {
    constructor() {
        super(...arguments);
        this.substitution = ts.SyntaxKind.FunctionDeclaration;
    }
    transform(node, context) {
        const typeDefinitions = [];
        const typeChecks = [];
        if (!node.parameters) {
            return node;
        }
        for (const param of node.parameters) {
            if (param.type === undefined) {
                continue;
            }
            const paramName = param.name.getText();
            const typeDefinition = utils_1.generator.createTypeDefinition(param.type, `_${paramName}Type`);
            const typeCheck = ts.factory.createStatement(ts.factory.createCall(ts.factory.createPropertyAccess(ts.factory.createCall(ts.factory.createPropertyAccess(ts.factory.createIdentifier('t'), ts.factory.createIdentifier('param')), [], [
                ts.factory.createLiteral(paramName),
                ts.factory.createIdentifier(`_${paramName}Type`),
                param.questionToken === undefined ? ts.factory.createLiteral(false) : ts.factory.createLiteral(true),
            ]), ts.factory.createIdentifier('assert')), [], [ts.factory.createIdentifier(paramName)]));
            ts.factory.createStatement(utils_1.generator.createTypeCall(`_${paramName}Type`, 'assert', [ts.factory.createIdentifier(paramName)]));
            typeDefinitions.push(typeDefinition);
            typeChecks.push(typeCheck);
        }
        let returnTypeDefinition = [];
        let returnTypeCheck = [];
        if (node.type !== undefined) {
            returnTypeDefinition.push(ts.factory.createVariableStatement([], ts.factory.createVariableDeclarationList([
                ts.factory.createVariableDeclaration('_returnType', undefined, ts.factory.createCall(ts.factory.createPropertyAccess(ts.factory.createIdentifier('t'), ts.factory.createIdentifier('return')), [], [utils_1.generator.createTypeCalls(node.type)])),
            ], undefined, ts.NodeFlags.Const)));
        }
        const paramList = ts.factory.createVariableStatement([], ts.factory.createVariableDeclarationList(typeDefinitions, undefined, ts.NodeFlags.Let));
        const body = node.body;
        body.statements.unshift(paramList, ...returnTypeDefinition, ...typeChecks);
        const updatedNode = ts.factory.updateFunctionDeclaration(node, node.decorators, node.modifiers, node.name, node.typeParameters, node.parameters, node.type, body);
        return updatedNode;
    }
}
exports.FunctionDeclarationTransformer = FunctionDeclarationTransformer;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FunctionDeclarationTransformer;
