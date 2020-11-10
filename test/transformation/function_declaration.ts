export default () => {
  // Function body transformations are already covered by other tests
  describe('Function Declaration', () => {
    it('should be annotated', () => {
      const input = `function foo() { }`;

      const expected = `
      import t from "ts-runtime/lib";

      function foo() {
      }
      t.annotate(foo, t.function(t.return(t.any())));`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should not be annotated with noAnnotate', () => {
      const input = `function foo() { }`;

      const expected = `function foo() { }

      export {};`;

      const result = util.transform(input, { noAnnotate: true });

      util.compare(expected, result);
    });
  });
}
