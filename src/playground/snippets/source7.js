const Test = t.type("Test", t.n(t.object(t.property("x", t.n(t.string())), t.property("y", t.n(t.boolean())), t.property("z", t.any()))));
let _aType = t.n(t.object(t.property("x", t.n(t.string())), t.property("y", t.n(t.boolean())), t.property("z", t.any()))), a = _aType.assert({ x: 'one', y: true, z: undefined });
let _bType = t.n(t.ref(Test)), b = _bType.assert(a);
const Direction = t.type("Direction", t.n(t.union(t.n(t.string("north")), t.n(t.string("east")), t.n(t.string("south")), t.n(t.string("west")))));
const EastWest = t.type("EastWest", t.n(t.union(t.n(t.string("east")), t.n(t.string("west")))));
let _dirType = t.n(t.ref(Direction)), dir;
let _nsDirType = t.n(t.union(t.n(t.string("")), t.n(t.string("north")), t.n(t.string("south")))), nsDir = _nsDirType.assert(!is(dir) && dir);
let _bbType = t.n(t.union(t.n(t.string("north")), t.n(t.string("east")), t.n(t.string("south")), t.n(t.string("west")))), bb;
const x = t.n(t.typeOf(dir)).assert('north');
const IA = t.type("IA", t.property("m", t.n(t.function(t.return(t.n(t.boolean()))))));
const IB = t.type("IB", t.property("a", t.n(t.string())));
const ITest = t.type("ITest", t.intersect(IA, IB, t.property("b", t.n(t.string())), t.callProperty(t.function(t.param("prop", t.n(t.string()), true), t.return(t.n(t.ref(IA))))), t.property("c", t.n(t.ref(t.tdz(() => ITest))))));
const A = t.type("A", t.property("yy", t.n(t.string())));
const A = t.type("A", t.property("y", t.n(t.ref(t.tdz(() => C)))));
const C = t.type("C", t.intersect(A, B, t.property("a", t.n(t.string())), t.property("b", t.n(t.object(t.property("a", t.n(t.ref(t.tdz(() => C)))))))));
const B = t.type("B", t.property("x", t.n(t.ref(C))));
function abc(a) {
    return new CC();
}
let _myvarType = t.n(t.ref(t.tdz(() => CC))), myvar = _myvarType.assert(abc());
class CC {
}
