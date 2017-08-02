import * as path from 'path';
import * as ts from 'typescript';
import { Factory } from '../../src/factory';

export default () => {
  describe('Factory', () => {
    let input = `let foo: string = "bar";`;
    let factory: Factory;

    beforeEach(() => {
      const host = util.host(input);
      const context = util.context(util.program(host), host);
      factory = context.factory;
    });

    describe('#typeReflection', () => {
      it('should reflect parenthesized type nodes', () => {
        const type = ts.createParenthesizedType(
          ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        );
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect KeywordTypeNode AnyKeyword', () => {
        const type = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect KeywordTypeNode NumberKeyword', () => {
        const type = ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect KeywordTypeNode BooleanKeyword', () => {
        const type = ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect KeywordTypeNode StringKeyword', () => {
        const type = ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect KeywordTypeNode SymbolKeyword', () => {
        const type = ts.createKeywordTypeNode(ts.SyntaxKind.SymbolKeyword);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect KeywordTypeNode ObjectKeyword', () => {
        const type = ts.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect KeywordTypeNode VoidKeyword', () => {
        const type = ts.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect KeywordTypeNode NeverKeyword', () => {
        const type = ts.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect KeywordTypeNode NullKeywords', () => {
        const type = ts.createKeywordTypeNode(ts.SyntaxKind.NullKeyword);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect KeywordTypeNode UndefinedKeyword', () => {
        const type = ts.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect KeywordTypeNode ThisKeyword', () => {
        const type = ts.createKeywordTypeNode(ts.SyntaxKind.ThisKeyword);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect ThisTypeNode', () => {
        const type = ts.createThisTypeNode();
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect LiteralTypeNode', () => {
        const type = ts.createLiteralTypeNode(ts.createLiteral('Foo'));
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect ArrayTypeNode', () => {
        const type = ts.createArrayTypeNode(ts.createThisTypeNode());
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect TupleTypeNode', () => {
        const type = ts.createTupleTypeNode([
          ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
          ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)]
        );
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect UnionTypeNode', () => {
        const type = ts.createUnionTypeNode([
          ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
          ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)]
        );
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect IntersectionTypeNode', () => {
        const type = ts.createIntersectionTypeNode([
          ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
          ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)]
        );
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect TypeReferenceNode', () => {
        const type = ts.createTypeReferenceNode('Foo', []);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect FunctionTypeNode', () => {
        const type = ts.createFunctionTypeNode(
          [],
          [],
          ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
        );
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect ConstructorTypeNode', () => {
        const type = ts.createConstructorTypeNode(
          [],
          [],
          ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        );
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect TypeQueryNode', () => {
        const type = ts.createTypeQueryNode(ts.createIdentifier("Foo"));
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect TypeLiteralNode', () => {
        const type = ts.createTypeLiteralNode([]);
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect TypePredicateNode', () => {
        const type = ts.createTypePredicateNode(
          'param',
          ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
        );
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect ExpressionWithTypeArguments', () => {
        const type = ts.createExpressionWithTypeArguments(
          [],
          ts.createIdentifier("Foo")
        );
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect MappedTypeNode', () => {
        const type = ts.createMappedTypeNode(
          void 0, void 0, void 0,
          ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        );
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect IndexedAccessTypeNode', () => {
        const type = ts.createIndexedAccessTypeNode(
          ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
          ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        );
        const result = factory.typeReflection(type);
        expect(result).ok();
      });

      it('should reflect TypeOperatorNode', () => {
        const type = ts.createTypeOperatorNode(
          ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        );
        const result = factory.typeReflection(type);
        expect(result).ok();
      });
    });

    describe('#typeDeclaration', () => {
      it('should create a variable declaration from a string', () => {
        const result = factory.typeDeclaration(
          'Foo',
          ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        );

        expect(ts.isVariableDeclaration(result)).to.be(true);
      });

      it('should create a variable declaration from Identifier', () => {
        const result = factory.typeDeclaration(
          ts.createIdentifier('Foo'),
          ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        );

        expect(ts.isVariableDeclaration(result)).to.be(true);
      });
    });

    describe('#typeAssertion', () => {

    });

    describe('#TypeReflectionAndAssertion', () => {

    });

    describe('#anyTypeReflection', () => {

    });

    describe('#numberTypeReflection', () => {

    });

    describe('#booleanTypeReflection', () => {

    });

    describe('#stringTypeReflection', () => {

    });

    describe('#symbolTypeReflection', () => {

    });

    describe('#objectTypeReflection', () => {

    });

    describe('#voidTypeReflection', () => {

    });

    describe('#nullTypeReflection', () => {

    });

    describe('#undefinedTypeReflection', () => {

    });

    describe('#thisReflection', () => {

    });

    describe('#literalTypeReflection', () => {

    });

    describe('#booleanLiteralTypeReflection', () => {

    });

    describe('#numericLiteralTypeReflection', () => {

    });

    describe('#stringLiteralTypeReflection', () => {

    });

    describe('#arrayTypeReflection', () => {

    });

    describe('#tupleTypeReflection', () => {

    });

    describe('#unionTypeReflection', () => {

    });

    describe('#intersectionTypeReflection', () => {

    });

    describe('#typeReferenceReflection', () => {

    });

    describe('#functionTypeReflection', () => {

    });

    describe('#constructorTypeReflection', () => {

    });

    describe('#typeQueryReflection', () => {

    });

    describe('#typeLiteralReflection', () => {

    });

    describe('#expressionWithTypeArgumentsReflection', () => {

    });

    describe('#typeAliasReflection', () => {

    });

    describe('#typeAliasSubstitution', () => {

    });

    describe('#interfaceReflection', () => {

    });

    describe('#interfaceSubstitution', () => {

    });

    describe('#classReflection', () => {

    });

    describe('#namedDeclarationsReflections', () => {

    });

    describe('#namedDeclarationReflection', () => {

    });

    describe('#enumReflection', () => {

    });

    describe('#enumMemberReflection', () => {

    });

    describe('#variableReflection', () => {

    });

    describe('#functionReflection', () => {

    });

    describe('#returnTypeReflection', () => {

    });

    describe('#typeParameterReflection', () => {

    });

    describe('#indexSignatureReflection', () => {

    });

    describe('#propertySignatureReflection', () => {

    });

    describe('#propertyReflection', () => {

    });

    describe('#callSignatureReflection', () => {

    });

    describe('#constructSignatureReflection', () => {

    });

    describe('#constructorReflection', () => {

    });

    describe('#methodReflection', () => {

    });

    describe('#methodSignatureReflection', () => {

    });

    describe('#getAccessorReflection', () => {

    });

    describe('#setAccessorReflection', () => {

    });

    describe('#parameterReflection', () => {

    });

    describe('#elementReflection', () => {

    });

    describe('#elementsReflection', () => {

    });

    describe('#classTypeParameterSymbolDeclaration', () => {

    });

    describe('#classTypeParameterSymbolConstructorDeclaration', () => {

    });

    describe('#classTypeParameterSymbolPropertyDeclaration', () => {

    });

    describe('#typeParameterDeclaration', () => {

    });

    describe('#typeParametersLiteral', () => {

    });

    describe('#typeParametersLiteralDeclaration', () => {

    });

    describe('#typeParameterBindingDeclaration', () => {

    });

    describe('#assertReturnStatements', () => {

    });

    describe('#mutateFunctionBody', () => {

    });

    describe('#propertyNameToLiteralOrExpression', () => {

    });

    describe('#declarationNameToLiteralOrExpression', () => {

    });

    describe('#importLibStatement', () => {

    });

    describe('#importDeclarationsStatement', () => {

    });

    describe('#decorate', () => {

    });

    describe('#annotate', () => {

    });

    describe('#nullable', () => {

    });

    describe('#nostrict', () => {

    });

    describe('#intersect', () => {

    });

    describe('#flowInto', () => {

    });

    describe('#tdz', () => {

    });

    describe('#selfReference', () => {

    });

    describe('#asObject', () => {

    });

    describe('#asRef', () => {

    });

    describe('#asType', () => {

    });

    describe('#asClass', () => {

    });

    describe('#asVar', () => {

    });

    describe('#asStatement', () => {

    });

    describe('#libCall', () => {

    });

    describe('#propertyAccessCall', () => {

    });

    describe('#state', () => {

    });

    describe('#rule', () => {

    });

    describe('#match', () => {

    });
  });
};
