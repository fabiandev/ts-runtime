export default () => {
  describe('Program Error', () => {
    it('should throw an error for classes with unsupported heritage clause', () => {
      const input = `class Foo extends class { } { }`;

      util.expectProgramError(() => util.transform(input));
    });
  });
}
