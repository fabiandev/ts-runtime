'use strict';

const visitors = [];

require('fs').readdirSync(__dirname).forEach(file => {
  if (file.endsWith('Visitor.js')) {
    visitors.push(require(`./${file}`));
  }
});

module.exports = visitors;
