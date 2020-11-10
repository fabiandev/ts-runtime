export default () => {
  // Function body transformations are already covered by other tests
  describe('Function Expression', () => {
    it('should be annotated', () => {
      const input = `let foo = function() { };`;

      const expected = `
      import t from "ts-runtime/lib";

      let foo = t.annotate(function () {
      }, t.function(t.return(t.any())));`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should not be annotated with noAnnotate', () => {
      const input = `let foo = function() { };`;

      const expected = `let foo = function () { };

      export {};`;

      const result = util.transform(input, { noAnnotate: true });

      util.compare(expected, result);
    });
  });
}
