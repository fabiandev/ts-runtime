export default () => {
  describe('Transform', () => {
    it('should transform a file reflection', () => {
      const input = `let foo: string = 'bar'`;
      const result = util.transform(input);
      expect(result).ok();
    });

    it('should enable the preserveConstEnums option', () => {
      const input = `const enum Foo { }`;

      const result = util.transform(input, { compilerOptions: { preserveConstEnums: false } });

      const expected = `
      import t from "ts-runtime/lib";

      var Foo;
      (function (Foo) {
      })(Foo || (Foo = {}));
      t.annotate(Foo, t.enum());`;

      util.compare(result, expected);
    });

    it('should enable the experimentalDecorators option', () => {
      const input = ``;
      const result = util.transform(input, { compilerOptions: { experimentalDecorators: false } });
    });
  });
};
