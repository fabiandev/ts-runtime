"use strict";
const config_1 = require("../../config");
class Transformer {
    constructor(config) {
        this.visited = [];
        this.config = config ? config : Transformer.DEFAULT_CONFIG;
    }
    getSubstitutions() {
        return !Array.isArray(this.substitution) ? [this.substitution] : this.substitution;
    }
    getVisited() {
        return this.visited;
    }
    process(node, context) {
        if (this.config.skipGenerated && this.wasGenerated(node)) {
            return node;
        }
        if (this.config.skipVisited) {
            if (this.wasVisited(node)) {
                return node;
            }
            this.visited.push(node);
        }
        if (this.getSubstitutions().indexOf(node.kind) === -1) {
            return node;
        }
        return this.transform(node, context);
    }
    wasGenerated(node) {
        return !node.parent;
    }
    wasVisited(node) {
        return this.visited.indexOf(node) !== -1;
    }
}
exports.Transformer = Transformer;
Transformer.DEFAULT_CONFIG = config_1.DEFAULT_CONFIG;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Transformer;
