type TestType = {
  name: string;
}

const a: string = 10;
let b: number[];
b = [a];

function testFunction (t: TestType): string {
  return 'Hello ' + t.name;
}

console.log(testFunction({name: 'Alice'}));
