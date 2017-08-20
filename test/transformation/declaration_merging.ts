export default () => {
  describe('Declaration Merging', () => {
    it('should merge interfaces', () => {
      const input = `
      interface Foo {
        prop: string;
      }

      interface Foo {
        prop2: number;
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      const Foo = t.type("Foo", t.object(t.property("prop", t.string()), t.property("prop2", t.number())));`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should merge classes and interfaces', () => {
      const input = `
      class Foo {
        prop: string;
      }

      interface Foo {
        prop2: number;
      }`;

      const expected = `
      t.annotate(t.class("Foo", t.property("prop", t.string()), t.property("prop2", t.number())))`;

      const result = util.transform(input);

      util.contains(expected, result);
    });

    it('should merge interfaces and classes', () => {
      const input = `
      interface Foo {
        prop2: number;
      }

      class Foo {
        prop: string;
      }`;

      const expected = `
      t.annotate(t.class("Foo", t.property("prop2", t.number()), t.property("prop", t.string())))`;

      const result = util.transform(input);

      util.contains(expected, result);
    });

    it('should merge interfaces and classes with overloads', () => {
      const input = `
      interface Foo {
        prop2: number;
        method(a: string): number;
      }

      class Foo {
        prop: string;
        method(a: boolean): symbol;
        method(a: any): any { }
      }`;

      const expected = `
      t.annotate(t.class("Foo", t.property("prop2", t.number()), t.property("prop", t.string()), t.property("method", t.function(t.param("a", t.union(t.string(), t.boolean())), t.return(t.union(t.number(), t.symbol()))))))`;

      const result = util.transform(input);

      util.contains(expected, result);
    });
  });
}
