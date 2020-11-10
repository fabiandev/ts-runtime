export default () => {
  describe('Source File', () => {
    it('should remain empty if containing whitespaces only', () => {
      const input = ` `;

      const expected = `export {};`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should not import lib if not required', () => {
      const input = `let foo = "bar";`;

      const expected = `let foo = "bar";

      export {};`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should prefix the lib identifier if it is already in use', () => {
      const input = `let t: string = "foo";`;

      const expected = `
      import _t from "ts-runtime/lib";
      let _tType = _t.string(), t = _tType.assert("foo");`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should recursively prefix the lib identifier if it is already in use', () => {
      const input = `
      let t: string = "foo";
      let _t: string = "bar";`;

      const expected = `
      import __t from "ts-runtime/lib";
      let _tType = __t.string(), t = _tType.assert("foo");
      let __tType = __t.string(), _t = __tType.assert("bar");`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should not reflect built ins by default', () => {
      const input = `let foo: Set<any>;`;

      const expected = `
      import t from "ts-runtime/lib";
      let _fooType = t.ref(Set, t.any()), foo;`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should reflect ambient and external types in a separate file and import it', () => {
      const input = `
      declare type Foo = string;
      let foo: Foo;`;

      const expected = `
      import "./tsr-declarations";
      import t from "ts-runtime/lib";
      let _fooType = t.ref("Foo.__UID__"), foo;`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should import module-alias if desired', () => {
      const input = ``;

      const expected = `import "module-alias/register";`;

      const result = util.transform(input, { moduleAlias: true });

      util.compare(expected, result);
    });
  });
}
