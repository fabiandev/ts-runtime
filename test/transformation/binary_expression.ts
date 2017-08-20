export default () => {
  describe('Binary Expression', () => {
    it('should not assert non-assignment operators', () => {
      const input = `
      let a: boolean = true;
      let b: boolean = false;
      a && b;
      `;

      const expected = `
      import t from "ts-runtime/lib";
      let _aType = t.boolean(), a = _aType.assert(true);
      let _bType = t.boolean(), b = _bType.assert(false);
      a && b;`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert assignments', () => {
      const input = `
      let foo: string;
      foo = "bar";
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.string(), foo;
      foo = _fooType.assert("bar");`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert addition assignments', () => {
      const input = `
      let foo: number = 1;
      foo += 1;
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.number(), foo = _fooType.assert(1);
      foo += _fooType.assert(1);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert substraction assignments', () => {
      const input = `
      let foo: number = 1;
      foo -= 1;
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.number(), foo = _fooType.assert(1);
      foo -= _fooType.assert(1);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert multiplication assignments', () => {
      const input = `
      let foo: number = 1;
      foo *= 1;
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.number(), foo = _fooType.assert(1);
      foo *= _fooType.assert(1);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert division assignments', () => {
      const input = `
      let foo: number = 1;
      foo /= 1;
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.number(), foo = _fooType.assert(1);
      foo /= _fooType.assert(1);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert remainder assignments', () => {
      const input = `
      let foo: number = 1;
      foo %= 1;
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.number(), foo = _fooType.assert(1);
      foo %= _fooType.assert(1);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert exponentiation assignments', () => {
      const input = `
      let foo: number = 1;
      foo **= 1;
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.number(), foo = _fooType.assert(1);
      foo = Math.pow(foo, _fooType.assert(1));`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert left shift assignments', () => {
      const input = `
      let foo: number = 1;
      foo <<= 1;
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.number(), foo = _fooType.assert(1);
      foo <<= _fooType.assert(1);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert right shift assignments', () => {
      const input = `
      let foo: number = 1;
      foo >>= 1;
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.number(), foo = _fooType.assert(1);
      foo >>= _fooType.assert(1);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert unsigned right shift assignments', () => {
      const input = `
      let foo: number = 1;
      foo >>>= 1;
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.number(), foo = _fooType.assert(1);
      foo >>>= _fooType.assert(1);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert bitwise AND assignments', () => {
      const input = `
      let foo: number = 1;
      foo &= 1;
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.number(), foo = _fooType.assert(1);
      foo &= _fooType.assert(1);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert bitwise XOR assignments', () => {
      const input = `
      let foo: number = 1;
      foo ^= 1;
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.number(), foo = _fooType.assert(1);
      foo ^= _fooType.assert(1);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should assert bitwise OR assignments', () => {
      const input = `
      let foo: number = 1;
      foo |= 1;
      `;

      const expected = `
      import t from "ts-runtime/lib";

      let _fooType = t.number(), foo = _fooType.assert(1);
      foo |= _fooType.assert(1);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should not assert any', () => {
      const input = `
      let foo: any;
      foo = 1;`;

      const expected = `
      let foo;
      foo = 1;`;

      const result = util.transform(input);

      util.compare(expected, result);
    });
  });
}
