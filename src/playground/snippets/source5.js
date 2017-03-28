"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var source6_1 = require("./source6");
// Variable with implicit complex type
var _aType = t.nullable(t.array(t.nullable(t.number()))), a = _aType.assert(source6_1.test());
// Constant with implicit complex type
var b = t.nullable(t.array(t.nullable(t.number()))).assert(source6_1.test());
// Variable reassignment
a = _aType.assert(19);
// Constant with explicit any type
var c = 10;
// Variable with explicit any type
var d = 'foo';
d = 'bar';
// Variable with implicit any type
var f;
f = 'hi';
// Variable with explicit complex type
var _gType = t.nullable(t.array(t.nullable(t.ref(Symbol)))), g;
g = _gType.assert([Symbol(1), Symbol(2)]);
var _hType = t.nullable(t.union(t.void(), t.null())), h;
var _iType = t.nullable(t.union(t.nullable(t.number()), t.nullable(t.array(t.nullable(t.array(t.nullable(t.boolean()))))), t.nullable(t.ref(Symbol)))), i;
var _jType = t.nullable(t.void()), j;
var _kType = t.nullable(t.null()), k;
var _lType = t.nullable(t.symbol()), l;
var _mType = t.nullable(t.this(this)), m;
// Variable with implicit complex type
var _eType = t.nullable(t.array(t.nullable(t.nullable(t.union(t.nullable(t.string()), t.nullable(t.number())))))), e = _eType.assert(['one', 10, 'three']);
e = _eType.assert('hello');
var _nType = t.nullable(t.number(10)), n;
var _oType = t.nullable(t.boolean(true)), o;
var _pType = t.nullable(t.string("str")), p;
var _qType = t.nullable(t.boolean(false)), q;
var _rType = t.nullable(t.ref(o)), r;
var _sType = t.nullable(t.object()), s = _sType.assert({});
var _tType = t.nullable(t.ref(Object)), t = _tType.assert({});
var _uType = t.nullable(t.object(t.property("x", t.nullable(t.number())))), u = _uType.assert({});
var _vType = t.nullable(t.ref(Function)), v = _vType.assert(function () { });
var AA = t.type("AA", t.nullable(t.object(t.property("x", t.nullable(t.number())))));
var _wType = t.nullable(t.array(t.nullable(t.any()))), w = _wType.assert([1, 'str', {}, Symbol(1)]);
var _xType = t.nullable(t.array(t.nullable(t.nullable(t.union(t.nullable(t.string()), t.nullable(t.number())))))), x = _xType.assert([1, 'str']);
var _yType = t.nullable(t.object(t.property("one", t.nullable(t.number())), t.property("two", t.nullable(t.string())))), y = _yType.assert({
    one: 1,
    two: 'str'
});
var _zType = t.nullable(t.object(t.property("one", t.nullable(t.number())), t.property("two", t.nullable(t.string())), t.property("three", t.nullable(t.any())))), z = _zType.assert({
    one: 1,
    two: 'str',
    three: Symbol(1)
});
var _ab1Type = t.nullable(t.intersection(t.nullable(t.nullable(t.union(t.nullable(t.ref(A)), t.nullable(t.ref(B))))), t.nullable(t.ref(B)))), ab1;
var _ab2Type = t.nullable(t.union(t.nullable(t.ref(A)), t.nullable(t.intersection(t.nullable(t.ref(B)), t.nullable(t.ref(B)))))), ab2;
var _xType = t.nullable(t.object(t.indexer("index", t.nullable(t.string()), t.nullable(t.any())), t.property("one", t.nullable(t.number())))), x;
var IA = t.type("IA", t.object(t.property("one", t.nullable(t.number())), t.property("two", t.nullable(t.string()), true), t.property("three", t.nullable(t.function(t.param("param1", t.nullable(t.string())), t.param("param2", t.nullable(t.number()), true), t.return(t.nullable(t.array(t.nullable(t.number())))))))));
var IB = t.type("IB", t.nullable(t.object(t.property("one", t.nullable(t.number())), t.property("two", t.nullable(t.string()), true))));
var NN = t.type("NN", t.nullable(t.number()));
var _xxxxType = t.nullable(t.ref(NN)), xxxx;
var B = (function () {
    function B() {
    }
    return B;
}());
var A = (function (_super) {
    __extends(A, _super);
    function A() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    A.method1 = function () {
    };
    A.prototype.method2 = function (p1, p2, p3) {
        if (p2 === void 0) { p2 = true; }
        var _p1Type = t.nullable(t.number());
        var _p2Type = t.nullable(t.boolean());
        var _p3Type = t.nullable(t.string());
        var _returnType = t.return(t.nullable(t.union(t.void(), t.null())));
        t.param("p1", _p1Type).assert(p1);
        t.param("p2", _p2Type).assert(p2);
        t.param("p3", _p3Type).assert(p3);
        return _returnType.assert();
    };
    return A;
}(B));
var CC = (function (_super) {
    __extends(CC, _super);
    function CC() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CC;
}(A));
;
var _aType = t.nullable(t.function(t.param("p1", t.nullable(t.number())), t.param("p2", t.nullable(t.any())), t.param("p3", t.nullable(t.string()), true), t.return(t.nullable(t.union(t.void(), t.null()))))), a;
