interface X {

}

interface Y {
  prop: string;
}

class Z {

}

interface A extends X {
  createElement(a: string): number;
  createElement(a: number): boolean;
}

interface A extends Y, Z {
  createElement(a: boolean): string;
}
