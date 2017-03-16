var __implement = (this && this.__implement) || function __implement(obj, t) {
  if (!Array.isArray(obj.prototype.__implements)) obj.prototype.__implements = [];
  if (t && obj.prototype.__implements.indexOf(t) === -1) obj.prototype.__implements.push(t);
}

module.exports = __implement;
