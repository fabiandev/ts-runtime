export default () => {
  describe('Transform', () => {
    it('should transform a file reflection', () => {
      const input = `let foo: string = 'bar'`;
      const result = util.transform(input);
      expect(result).ok();
    });
  });
};
