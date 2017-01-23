const ts = require('typescript');

const visitor = {
  filter: function filter(node) {
    return false;
  },
  visit: function visit(node, context) {

  }
};

module.exports = visitor;
