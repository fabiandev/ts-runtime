import * as ts from 'typescript';
import { Factory } from '../../src/factory';

export default () => {
  // function foo(): new () => any;
  describe('ConstructorTypeNode', () => {
    let input = `let foo: string = "bar";`;
    let factory: Factory;

    beforeEach(() => {
      const host = util.host(input);
      const context = util.context(util.program(host), host);
      factory = context.factory;
    });

    it('should reflect ConstructorTypeNode', () => {
      const type = ts.createConstructorTypeNode(
        [],
        [],
        ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
      );

      util.expectError(() => factory.typeReflection(type));
    });
  });
};
