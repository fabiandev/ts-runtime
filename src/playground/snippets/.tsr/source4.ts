import { bla } from './source3';
console.log(bla);
type TestType = {
    name: string;
};
const a: string = t.string().assert('hallo');
let _bType = t.array(t.number()), b: number[];
b = _bType.assert([10]);
function testFunction(t: TestType): string {
    return 'Hello ' + t.name;
}
console.log(testFunction({ name: 'Alice' }));
let hasAnyType: any;
hasAnyType = 55;
const constAny: any = 10;
let _xType = t.array(t.number()), x = _xType.assert([5, 10]);
let hasNoType;
hasNoType = 5;
var _hiType = t.string(), hi: string;
hi = _hiType.assert(console);
const y = t.array(t.string()).assert(['hallo', 'du']);
x = _xType.assert(5);
x = _xType.assert('hi');
hasNoType = 'str';
