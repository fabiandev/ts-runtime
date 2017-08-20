export default () => {
  describe('Interface Declaration', () => {
    it('should be reflected', () => {
      const input = `interface Foo { }`;

      const expected = `
      import t from "ts-runtime/lib";

      const Foo = t.type("Foo", t.object());`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform extending other types', () => {
      const input = `
      interface Bar { }
      interface Foo extends Bar { }`;

      const expected = `
      import t from "ts-runtime/lib";

      const Bar = t.type("Bar", t.object());
      const Foo = t.type("Foo", t.intersect(t.ref(Bar), t.object()));`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should support type parameters', () => {
      const input = `
      interface Foo<T> {
        prop: T;
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      const Foo = t.type("Foo", Foo => {
        const T = Foo.typeParameter("T");
        return t.object(t.property("prop", T));
      });`;

      const result = util.transform(input);

      util.compare(expected, result);
    });
  });
}
