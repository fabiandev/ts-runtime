let abc: {my: string, xyz: number} = { my: 'foo', xyz: 1 };
let { my, xyz } = abc;
my = 10;



enum B {
  One,
  Two,
  Three
}


let aaa = B; // ref?

let xxx = B.One; // can be 0, 1, 2

let yyy: B.One; // can only be 0

let zzz: B; // same as xxx


type Direction = 'north' | 'east' | 'south' | 'west';
type EastWest = 'east' | 'west';
declare function is<T>(x: any): x is T;
let dir: Direction;
let nsDir = !is<EastWest>(dir) && dir;
