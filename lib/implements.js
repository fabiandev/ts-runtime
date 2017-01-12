var __implements = (this && this.__implements) || function __implements(a, b, parent) {
  var o = typeof a === 'object' ? a : a.prototype;
  return Array.isArray(o.__implements) && o.__implements.indexOf(b) !== -1;
}

module.exports = __implements;
