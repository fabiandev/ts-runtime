type ComplexType = {};
type one = {};
type two = {};

function f(param1: boolean, param2?: string[]): string {

  let x: ComplexType = () => {
    const a: boolean = true;
    return a;
  };

  const b: number = 10;
  let c: string;
  let d: boolean[] = [true, false];

  const e: number[][][] = [[[10]]];

  c = 'hi';

  let f: [one, two];

  return c;
}
