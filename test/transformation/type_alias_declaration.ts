export default () => {
  describe('Type Alias Declaration', () => {
    it('should be reflected', () => {
      const input = `type Foo = any;`;

      const expected = `
      import t from "ts-runtime/lib";

      const Foo = t.type("Foo", t.any());
      `;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should support type parameters', () => {
      const input = `type Foo<T> = {
        prop: T;
      };`;

      const expected = `
      import t from "ts-runtime/lib";

      const Foo = t.type("Foo", Foo => {
        const T = Foo.typeParameter("T");
        return t.object(t.property("prop", T));
      });`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should support self references', () => {
      const input = `type Foo = {
        prop: Foo;
      };`;

      const expected = `
      import t from "ts-runtime/lib";

      const Foo = Foo => t.object(t.property("prop", t.ref(Foo)));`;

      const result = util.transform(input);

      util.compare(expected, result);
    });
  });
}
