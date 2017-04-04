import { X } from './source8';

type Test = {
  x: string;
  y: boolean;
  z;
};

let a: {
  x: string;
  y: boolean;
  z;
} = {x: 'one', y: true, z: undefined};

let b: Test = a;


type Direction = 'north' | 'east' | 'south' | 'west';
type EastWest = 'east' | 'west';
declare function is<T>(x: any): x is T;
let dir: Direction;
let nsDir = !is<EastWest>(dir) && dir;
let bb: 'north' | 'east' | 'south' | 'west';


const x: typeof dir = 'north';


interface IA {
  m(): boolean;
}

interface IB {
  a: string;
}

interface ITest extends IA, IB {
  b: string;
  (prop?: string): IA
  c: ITest;
}

interface A {
  yy: string;
}
interface A {
	y: C;
}
interface C extends A, B {
  a: string;
  b: {a: C};
}
interface B {
  x: C;
}

function abc(a) {
  return new CC();
}

let myvar = abc();

class CC {

}
