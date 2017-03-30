let abc: {my: string, xyz: number} = { my: 'foo', xyz: 1 };
let { my, xyz } = abc;
my = 10;



enum B {
  One,
  Two,
  Three
}

let xxx = B.One;

let yyy: B.One;
