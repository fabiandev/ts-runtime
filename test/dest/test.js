"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
exports.CanSpeak = Symbol('CanSpeak');
var CanWalk = Symbol('CanWalk');
var Human = (function () {
    function Human() {
    }
    return Human;
}());
var Person = (function (_super) {
    __extends(Person, _super);
    function Person() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(Person.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });
    return Person;
}(Human));
__implement(Person, exports.CanSpeak);
__implement(Person, CanWalk);
var Test = (function (_super) {
    __extends(Test, _super);
    function Test() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Test;
}(Person));
var p = new Person();
var t = new Test();
if (__implements(Person, exports.CanSpeak)) {
    console.log('Person implements CanSpeak');
}
if (__implements(p, CanWalk)) {
    console.log('p implements CanWalk');
}
if (p instanceof Human) {
    console.log('p instanceof Human');
}
if (__implements(Test, exports.CanSpeak)) {
    console.log('Test implements CanSpeak');
}
if (__implements(t, CanWalk)) {
    console.log('t implements CanWalk');
}
