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

let u: { x: number; } = {};

let v: Function = () => {};

type AA = {
  x: number;
};

let w = [1, 'str', {}, Symbol(1)];
let x = [1, 'str'];

let y = {
  one: 1,
  two: 'str'
};

let z = {
  one: 1,
  two: 'str',
  three: Symbol(1)
};

let ab1: (A | B) & B;
let ab2: A | B & B;

let x: {
 [index: string]: any;
 one: number;
 // two?: new() => void;
 // three: () => void;
};

interface IA {
  one: number;
  two?: string;
  three: (param1: string, param2?: number) => number[];
}

type IB = {
  one: number;
  two?: string;
};

type NN = number;

let xxxx: NN;

class B {}

class A extends B {
  static a: string = 'str';

	b: number = 1;
  constructor() {
    super();
    return new CC();
  }
  static method1(): number {
  }

  method2(p1: number, p2 = true, p3?: string) {
    return;
  }
}
class CC extends A {};

let a: (p1: number, p2: any, p3?: string) => void;
