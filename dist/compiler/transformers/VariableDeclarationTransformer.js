"use strict";
const ts = require("typescript");
const Transformer_1 = require("./Transformer");
const utils_1 = require("../utils");
class VariableDeclarationTransformer extends Transformer_1.Transformer {
    constructor() {
        super(...arguments);
        this.substitution = ts.SyntaxKind.VariableDeclarationList;
    }
    transform(node) {
        const declarations = [];
        if (!node.declarations) {
            return node;
        }
        for (const declaration of node.declarations) {
            if (declaration.initializer)
                if (declaration.kind === ts.SyntaxKind.VariableDeclaration) {
                    declarations.push(...this.transformDeclaration(declaration));
                    continue;
                }
            declarations.push(declaration);
        }
        return ts.factory.updateVariableDeclarationList(node, declarations);
    }
    transformDeclaration(node) {
        if (this.wasGenerated(node)) {
            return [node];
        }
        if (!node.type) {
            if (node.parent.flags === ts.NodeFlags.Const) {
                return this.transformUntypedConstDeclaration(node);
            }
            return this.transformUntypedLetDeclaration(node);
        }
        if (node.parent.flags === ts.NodeFlags.Const) {
            return this.transformConstDeclaration(node);
        }
        return this.transformLetDeclaration(node);
    }
    transformLetDeclaration(node) {
        const nodeName = node.name.getText();
        const typeDefinition = utils_1.generator.createTypeDefinition(node.type, `_${nodeName}Type`);
        if (!node.initializer) {
            return [typeDefinition, node];
        }
        const initializer = utils_1.generator.createTypeCall(`_${nodeName}Type`, 'assert', [node.initializer]);
        const assignment = ts.factory.updateVariableDeclaration(node, node.name, node.type, initializer);
        return [typeDefinition, assignment];
    }
    transformConstDeclaration(node) {
        const nodeName = node.name.getText();
        const typeCalls = utils_1.generator.createTypeCalls(node.type);
        const initializer = ts.factory.createCall(ts.factory.createPropertyAccess(typeCalls, 'assert'), [], [node.initializer]);
        const assignment = ts.factory.updateVariableDeclaration(node, node.name, node.type, initializer);
        return [assignment];
    }
    transformUntypedLetDeclaration(node) {
        const nodeName = node.name.getText();
        const typeDefinition = utils_1.generator.createTypeDefinition('any', `_${nodeName}Type`);
        if (!node.initializer) {
            return [typeDefinition, node];
        }
        const initializer = utils_1.generator.createTypeCall(`_${nodeName}Type`, 'assert', [node.initializer]);
        const assignment = ts.factory.updateVariableDeclaration(node, node.name, node.type, initializer);
        return [typeDefinition, assignment];
    }
    transformUntypedConstDeclaration(node) {
        if (!this.config.assertConst) {
            return [node];
        }
        const nodeName = node.name.getText();
        const typeCalls = utils_1.generator.createTypeCall('t', 'any');
        const initializer = ts.factory.createCall(ts.factory.createPropertyAccess(typeCalls, 'assert'), [], [node.initializer]);
        const assignment = ts.factory.updateVariableDeclaration(node, node.name, node.type, initializer);
        return [assignment];
    }
}
exports.VariableDeclarationTransformer = VariableDeclarationTransformer;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VariableDeclarationTransformer;
