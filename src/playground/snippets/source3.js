export const bla = t.any().assert('bla');
console.log(bla);
const a = t.string().assert('hallo');
let _bType = t.array(t.number()), b;
b = _bType.assert([10]);
function testFunction(t) {
    return 'Hello ' + t.name;
}
console.log(testFunction({ name: 'Alice' }));
let hasAnyType;
hasAnyType = 55;
const constAny = 10;
function getX() {
    return [1, 2, 3];
}
let _aaaType = t.number(), aaa = _aaaType.assert(10);
const bbb = t.array(t.number()).assert(getX());
let _xType = t.array(t.number()), x = _xType.assert([5, 10]);
let hasNoType;
hasNoType = 5;
var _hiType = t.string(), hi;
hi = _hiType.assert(console);
const y = t.array(t.string()).assert(['hallo', 'du']);
const z = t.any().assert('hhh');
const h = t.array(t.number()).assert([1, 2]);
x = _xType.assert(5);
x = _xType.assert('hi');
hasNoType = 'str';
export const bla = t.array(t.number()).assert([10]);
const blub = t.any().assert('str');
let _wefkhType = t.number(), wefkh = _wefkhType.assert(111);
x = _xType.assert(5);
