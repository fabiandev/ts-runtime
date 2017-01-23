import * as ti from 'ts-type-info';

const file = ti.getInfoFromString(`function something(hi: string, two: boolean) {
  let i: number = 5;
  return i;
}`, { includeTsNodes: true });

console.log(file.write());
