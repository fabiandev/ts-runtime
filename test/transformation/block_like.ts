export default () => {
  describe('Block Like', () => {
    it('should annotate function declarations', () => {
      const input = `function foo() { }`;

      const expected = `
      import t from "ts-runtime/lib";

      function foo() { }
      t.annotate(foo, t.function(t.return(t.any())));`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should annotate enum declarations', () => {
      const input = `enum Foo { }`;

      const expected = `
      import t from "ts-runtime/lib";

      var Foo;
      (function (Foo) {
      })(Foo || (Foo = {}));
      t.annotate(Foo, t.enum());
      `;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should define type parameters symbol for class declarations with type parameters', () => {
      const input = `class A<T> { }`;

      const expected = `const _ATypeParametersSymbol = Symbol("ATypeParameters");`;

      const result = util.transform(input);

      util.contains(expected, result);
    });

    it('should transform SourceFile', () => {
      const input = `function foo() { }`;

      const expected = `
      import t from "ts-runtime/lib";

      function foo() { }
      t.annotate(foo, t.function(t.return(t.any())));`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform Block', () => {
      const input = `
      {
        function foo() { }
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      {
        function foo() { }
        t.annotate(foo, t.function(t.return(t.any())));
      }`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform ModuleBlock', () => {
      const input = `
      namespace Foo {
        function foo() { }
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      var Foo;
      (function (Foo) {
        function foo() { }
        t.annotate(foo, t.function(t.return(t.any())));
      })(Foo || (Foo = {}));`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform CaseClause', () => {
      const input = `
      switch(true) {
        case true:
        function foo() { }
        break;
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      switch (true) {
        case true:
        function foo() { }
        t.annotate(foo, t.function(t.return(t.any())));
        break;
      }`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform DefaultClause', () => {

    });
  });
}
