export default () => {
  describe('As Expression', () => {
    it('should be asserted', () => {
      const input = `10 as any as string`;

      const expected = `
      import t from "ts-runtime/lib";

      t.string().assert(10);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should not be asserted if any', () => {
      const input = `10 as any`;

      const expected = `10;`;

      const result = util.transform(input);

      util.compare(expected, result);
    });
  });
}
