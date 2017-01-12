var __implement = (this && this.__implement) || function __implement(obj, t) {
  if (!Array.isArray(obj.prototype.__implements)) obj.prototype.__implements = [];
  if (t && obj.prototype.__implements.indexOf(t) === -1) obj.prototype.__implements.push(t);
}

var __implements = (this && this.__implements) || function __implements(a, b, parent) {
  var o = typeof a === 'object' ? a : a.prototype;
  return Array.isArray(o.__implements) && o.__implements.indexOf(b) !== -1;
}
