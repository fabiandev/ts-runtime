import { test } from './source6';

// Variable with implicit complex type
let a = test();

// Constant with implicit complex type
const b = test();

// Variable reassignment
a = 19;

// Constant with explicit any type
const c: any = 10;

// Variable with explicit any type
let d: any = 'foo';
d = 'bar';

// Variable with implicit any type
let f;
f = 'hi';

// Variable with explicit complex type
let g: Symbol[];
g = [Symbol(1), Symbol(2)];

let h: void;
let i: number | boolean[][] | Symbol;
let j: undefined;
let k: null;
let l: symbol;
let m: this;

// Variable with implicit complex type
let e = ['one', 10, 'three'];
e = 'hello';

let n: 10;
let o: true;
let p: 'str';
let q: false;
let r: o;

let s: object = {};
let t: Object = {};
// let u: { x: number; } = {};
let v: Function = () => {};
