import { bla } from './source3';

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

let x = [5, 10];

let hasNoType;
hasNoType = 5;

var hi: string;

hi = console;

const y = ['hallo', 'du'];

x = 5;
x = 'hi';
hasNoType = 'str';
