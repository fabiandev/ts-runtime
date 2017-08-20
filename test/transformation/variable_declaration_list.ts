export default () => {
  describe('Variable Declaration List', () => {
    it('should not assert in for-of statements', () => {
      const input = `
      for (let foo of []) {

      }`;

      const expected = `
      for (let foo of []) {

      }`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should not assert in for-in statements', () => {
      const input = `
      for (let foo in {}) {

      }`;

      const expected = `
      for (let foo in {}) {

      }`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should not assert in catch clauses', () => {
      const input = `
      try {
      } catch (e) {
      }`;

      const expected = `
      try {

      } catch (e) {

      }`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should reflect let declarations', () => {
      const input = `let foo: string;`;

      const expected = `
      import t from "ts-runtime/lib";
      let _fooType = t.string(), foo;`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should reflect and assert let declarations', () => {
      const input = `let foo: string = "bar";`;

      const expected = `
      import t from "ts-runtime/lib";
      let _fooType = t.string(), foo = _fooType.assert("bar");`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should reflect and assert let reassignments', () => {
      const input = `
      let foo: string = "bar";
      foo = "bar";`;

      const expected = `
      import t from "ts-runtime/lib";
      let _fooType = t.string(), foo = _fooType.assert("bar");
      foo = _fooType.assert("bar");`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should reflect var declarations', () => {
      const input = `var foo: string;`;

      const expected = `
      import t from "ts-runtime/lib";
      var _fooType = t.string(), foo;`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should reflect and assert var declarations', () => {
      const input = `var foo: string = "bar";`;

      const expected = `
      import t from "ts-runtime/lib";
      var _fooType = t.string(), foo = _fooType.assert("bar");`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should reflect and assert var reassignments', () => {
      const input = `
      var foo: string = "bar";
      foo = "bar";`;

      const expected = `
      import t from "ts-runtime/lib";
      var _fooType = t.string(), foo = _fooType.assert("bar");
      foo = _fooType.assert("bar");`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should reflect and assert const declarations', () => {
      const input = `const foo: string = "bar";`;

      const expected = `
      import t from "ts-runtime/lib";
      const foo = t.string().assert("bar");`;

      const result = util.transform(input);

      util.compare(expected, result);
    });
  });
}
