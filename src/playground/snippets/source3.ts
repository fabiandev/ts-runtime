export const bla = 'bla';

console.log(bla);

type TestType = {
  name: string;
};

const a: string = 'hallo';
let b: number[];
b = [10];

function testFunction(t: TestType): string {
  return 'Hello ' + t.name;
}

console.log(testFunction({name: 'Alice'}));

let hasAnyType: any;
hasAnyType = 55;

const constAny: any = 10;

function getX() {
  return [1, 2, 3];
}

let aaa = 10;
const bbb = getX();
let x = [5, 10];

let hasNoType;
hasNoType = 5;

var hi: string;

hi = console;

const y = ['hallo', 'du'];

const z = 'hhh';
const h = [1, 2];

x = 5;
x = 'hi';
hasNoType = 'str';

export const bla = [10];

const blub = 'str';

let wefkh = 111;


x = 5;
