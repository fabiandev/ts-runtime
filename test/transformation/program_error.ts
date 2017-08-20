import { ProgramError } from '../../src/errors';

export default () => {
  describe('Program Error', () => {
    it('should throw an error for classes with unsupported heritage clause', () => {
      const input = `class Foo extends class { } { }`;

      expect(() => util.transform(input)).to.throwException(e => {
        expect(e).to.be.a(Error);
        expect(e.name).to.equal(ProgramError.id);
      });
    });
  });
}
