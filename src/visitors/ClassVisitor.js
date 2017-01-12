'use strict';

const ts = require('typescript');

const visitor = {
  filter: function filter(node) {
    return node.kind === ts.SyntaxKind.ClassDeclaration;
  },
  visit: function visit(node, context) {
    if (!node.heritageClauses) return;

    const implementing = [];

    node.heritageClauses.forEach(clause => {
      if (clause.token !== ts.SyntaxKind.ImplementsKeyword) return;
      if (!clause.types) return;

      clause.types.forEach(type => {
        implementing.push(type.expression.text);
      })
    });

    implementing.forEach(impl => {
      context.insertLine(
        node.getEnd(),
        `__implement(${node.name.text}, ${impl});`
      );
    });
  }
};

module.exports = visitor;
