'use strict';

const ts = require('typescript');

const visitor = {
  filter: function filter(node) {
    return node.kind === ts.SyntaxKind.InterfaceDeclaration;
  },
  visit: function visit(node, context) {
    let name = node.name.text;
    let exportKeyword = false;
    let defaultKeyword = false;

    if (node.modifiers) {
      node.modifiers.forEach(mod => {
        if (mod.kind === ts.SyntaxKind.ExportKeyword) {
          exportKeyword = true;
        }

        if (mod.kind === ts.SyntaxKind.DefaultKeyword) {
          defaultKeyword = true;
        }
      });
    }

    let replace = [
        exportKeyword ? 'export' : '',
        defaultKeyword ? 'default' : '',
        `const ${name} = Symbol('${name}');`
      ]
      .filter(val => val.length !== 0)
      .join(' ');

    context.replace(node.getStart(), node.getEnd(), replace);
  }
};

module.exports = visitor;
