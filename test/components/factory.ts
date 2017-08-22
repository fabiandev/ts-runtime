import * as ts from 'typescript';
import { Factory, FactoryState } from '../../src/factory';

// TODO: extensively assert the returned values
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

      // See: issues/constructor_type_node.ts
      // it('should reflect ConstructorTypeNode', () => {
      //
      // });

      it('should reflect TypeQueryNode', () => {
        const type = ts.createTypeQueryNode(ts.createIdentifier('Foo'));
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
          ts.createIdentifier('Foo')
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
      it('should assert compatibility of an Identifier and a value', () => {
        const identifier = ts.createIdentifier('foo');
        const expression = ts.createLiteral('foo');
        const result = factory.typeAssertion(identifier, expression);
        expect(result).ok();
      });

      it('should assert compatibility of an Identifier, passed as string, and a value', () => {
        const identifier = 'foo';
        const expression = ts.createLiteral('foo');
        const result = factory.typeAssertion(identifier, expression);
        expect(result).ok();
      });
    });

    describe('#TypeReflectionAndAssertion', () => {
      it('should reflect and assert a TypeNode and assert a value', () => {
        const typeNode = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        const expression = ts.createLiteral('foo');
        const result = factory.typeReflectionAndAssertion(typeNode, expression);
        expect(result).ok();
      });
    });

    describe('#anyTypeReflection', () => {
      it('should return a reflection for type any', () => {
        const result = factory.anyTypeReflection();
        expect(result).ok();
      });
    });

    describe('#numberTypeReflection', () => {
      it('should return a reflection for type number', () => {
        const result = factory.numberTypeReflection();
        expect(result).ok();
      });
    });

    describe('#booleanTypeReflection', () => {
      it('should return a reflection for type boolean', () => {
        const result = factory.booleanTypeReflection();
        expect(result).ok();
      });
    });

    describe('#stringTypeReflection', () => {
      it('should return a reflection for type string', () => {
        const result = factory.stringTypeReflection();
        expect(result).ok();
      });
    });

    describe('#symbolTypeReflection', () => {
      it('should return a reflection for type symbol', () => {
        const result = factory.symbolTypeReflection();
        expect(result).ok();
      });
    });

    describe('#objectTypeReflection', () => {
      it('should return a reflection for type object', () => {
        const result = factory.objectTypeReflection();
        expect(result).ok();
      });
    });

    describe('#voidTypeReflection', () => {
      it('should return a reflection for type void', () => {
        const result = factory.voidTypeReflection();
        expect(result).ok();
      });
    });

    describe('#nullTypeReflection', () => {
      it('should return a reflection for type null', () => {
        const result = factory.nullTypeReflection();
        expect(result).ok();
      });
    });

    describe('#undefinedTypeReflection', () => {
      it('should return a reflection for type undefined', () => {
        const result = factory.undefinedTypeReflection();
        expect(result).ok();
      });
    });

    describe('#thisReflection', () => {
      it('should return a reflection for type this', () => {
        const result = factory.thisTypeReflection();
        expect(result).ok();
      });
    });

    describe('#literalTypeReflection', () => {
      it('should return a reflection for LiteralTypeNode true', () => {
        const result = factory.literalTypeReflection(ts.createLiteralTypeNode(ts.createLiteral(true)));
        expect(result).ok();
      });

      it('should return a reflection for LiteralTypeNode false', () => {
        const result = factory.literalTypeReflection(ts.createLiteralTypeNode(ts.createLiteral(false)));
        expect(result).ok();
      });

      it('should return a reflection for LiteralTypeNode strings', () => {
        const result = factory.literalTypeReflection(ts.createLiteralTypeNode(ts.createLiteral('foo')));
        expect(result).ok();
      });

      it('should return a reflection for LiteralTypeNode numerics', () => {
        const result = factory.literalTypeReflection(ts.createLiteralTypeNode(ts.createLiteral(1)));
        expect(result).ok();
      });

      it('should throw for other literal kinds', () => {
        const node = { literal: { kind: -1 } } as any;
        util.expectProgramError(() => factory.literalTypeReflection(node));
      });
    });

    describe('#booleanLiteralTypeReflection', () => {
      it('should return a reflection for true keywords', () => {
        const result = factory.literalTypeReflection(ts.createLiteralTypeNode(ts.createLiteral(true)));
        expect(result).ok();
      });

      it('should return a reflection for false keywords', () => {
        const result = factory.literalTypeReflection(ts.createLiteralTypeNode(ts.createLiteral(false)));
        expect(result).ok();
      });
    });

    describe('#numericLiteralTypeReflection', () => {
      it('should return a reflection for numeric literals', () => {
        const result = factory.literalTypeReflection(ts.createLiteralTypeNode(ts.createLiteral(1)));
        expect(result).ok();
      });
    });

    describe('#stringLiteralTypeReflection', () => {
      it('should return a reflection for string literals', () => {
        const result = factory.literalTypeReflection(ts.createLiteralTypeNode(ts.createLiteral('foo')));
        expect(result).ok();
      });
    });

    describe('#arrayTypeReflection', () => {
      it('should reflect ArrayTypeNode', () => {
        const node = ts.createArrayTypeNode(ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword));
        const result = factory.arrayTypeReflection(node);
        expect(result).ok();
      });
    });

    describe('#tupleTypeReflection', () => {
      it('should reflect TubleTypeNode', () => {
        const node = ts.createTupleTypeNode([
          ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
          ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
        ]);
        const result = factory.tupleTypeReflection(node);
        expect(result).ok();
      });
    });

    describe('#unionTypeReflection', () => {
      it('should reflect TupleTypeNode', () => {
        const node = ts.createUnionTypeNode([
          ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
          ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
        ]);
        const result = factory.unionTypeReflection(node);
        expect(result).ok();
      });
    });

    describe('#intersectionTypeReflection', () => {
      it('should reflect IntertsectionTypeNode', () => {
        const node = ts.createIntersectionTypeNode([
          ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
          ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
        ]);
        const result = factory.intersectionTypeReflection(node);
        expect(result).ok();
      });
    });

    describe('#typeReferenceReflection', () => {
      it('should reflect TypeReferenceNode', () => {
        const node = ts.createTypeReferenceNode('Foo', []);
        const result = factory.typeReferenceReflection(node);
        expect(result).ok();
      });
    });

    describe('#functionTypeReflection', () => {
      it('should reflect FunctionTypeNode', () => {
        const node = ts.createFunctionTypeNode([], [], ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword));
        const result = factory.functionTypeReflection(node);
        expect(result).ok();
      });
    });

    // See: known_issues/constructor_type_node.ts
    // describe('#constructorTypeReflection', () => {
    //
    // });

    describe('#typeQueryReflection', () => {
      it('should reflect TypeQueryNode', () => {
        const node = ts.createTypeQueryNode(ts.createIdentifier('foo'))
        const result = factory.typeQueryReflection(node);
        expect(result).ok();
      });
    });

    describe('#typeLiteralReflection', () => {
      it('should reflect TypeLiteralNode', () => {
        const node = ts.createTypeLiteralNode([]);
        const result = factory.typeLiteralReflection(node);
        expect(result).ok();
      });
    });

    describe('#expressionWithTypeArgumentsReflection', () => {
      it('should reflect ExpressionWithTypeArguments', () => {
        const node = ts.createExpressionWithTypeArguments([], ts.createIdentifier('foo'))
        const result = factory.expressionWithTypeArgumentsReflection(node);
        expect(result).ok();
      });

      it('should throw for ExpressionWithTypeArguments not consisting of identifiers', () => {
        const node = ts.createExpressionWithTypeArguments([], ts.createClassExpression(void 0, void 0, void 0, void 0, []))
        util.expectProgramError(() => factory.expressionWithTypeArgumentsReflection(node));
      });
    });

    describe('#typeAliasReflection', () => {
      it('should reflect TypeAliasDeclaration', () => {
        const node = ts.createTypeAliasDeclaration(void 0, void 0, 'Foo', void 0, ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword));
        const result = factory.typeAliasReflection(node);
        expect(result).ok();
      });
    });

    describe('#typeAliasSubstitution', () => {
      it('should substitute TypeAliasDeclaration', () => {
        const node = ts.createTypeAliasDeclaration(void 0, void 0, 'Foo', void 0, ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword));
        const result = factory.typeAliasSubstitution(node);
        expect(result).ok();
      });
    });

    describe('#interfaceReflection', () => {
      it('should reflect InterfaceDeclaration', () => {
        const node = ts.createInterfaceDeclaration(void 0, void 0, 'Foo', void 0, void 0, []);
        const result = factory.interfaceReflection(node);
        expect(result).ok();
      });
    });

    describe('#interfaceSubstitution', () => {
      it('should substitute InterfaceDeclaration', () => {
        const node = ts.createInterfaceDeclaration(void 0, void 0, 'Foo', void 0, void 0, []);
        const result = factory.interfaceSubstitution(node);
        expect(result).ok();
      });
    });

    describe('#classReflection', () => {
      it('should reflect ClassDeclaration', () => {
        const node = ts.createClassDeclaration(void 0, void 0, 'Foo', void 0, void 0, []);
        const result = factory.classReflection(node);
        expect(result).ok();
      });
    });

    describe('#namedDeclarationsReflections', () => {
      it('should reflect named declarations for ambients or externals', () => {
        const node = ts.createInterfaceDeclaration(void 0, void 0, 'Foo', void 0, void 0, []);
        const result = factory.namedDeclarationsReflections('Foo.__UID__', [node], 'Foo');
        expect(result).ok();
      });
    });

    describe('#namedDeclarationReflection', () => {
      it('should reflect named InterfaceDeclaration', () => {
        const node = ts.createInterfaceDeclaration(void 0, void 0, 'Foo', void 0, void 0, []);
        const result = factory.namedDeclarationReflection('Foo.__UID__', node, 'Foo');
        expect(result).ok();
      });

      it('should reflect named ClassDeclaration', () => {
        const node = ts.createClassDeclaration(void 0, void 0, 'Foo', void 0, void 0, []);
        const result = factory.namedDeclarationReflection('Foo.__UID__', node, 'Foo');
        expect(result).ok();
      });

      // should be removed?
      it('should reflect named TypeLiteralNode', () => {
        const node = ts.createTypeLiteralNode([])
        const result = factory.namedDeclarationReflection('Foo.__UID__', node, 'Foo');
        expect(result).ok();
      });

      it('should reflect named EnumDeclaration', () => {
        const node = ts.createEnumDeclaration(void 0, void 0, 'Foo', []);
        const result = factory.namedDeclarationReflection('Foo.__UID__', node, 'Foo');
        expect(result).ok();
      });

      // should be removed?
      it('should reflect named EnumMember', () => {
        const node = ts.createEnumMember('foo')
        const result = factory.namedDeclarationReflection('foo.__UID__', node, 'foo');
        expect(result).ok();
      });

      it('should reflect named FunctionDeclaration', () => {
        const node = ts.createFunctionDeclaration(void 0, void 0, void 0, 'foo', void 0, [], void 0, ts.createBlock([]));
        const result = factory.namedDeclarationReflection('foo.__UID__', node, 'foo');
        expect(result).ok();
      });

      it('should reflect named VariableDeclaration', () => {
        const node = ts.createVariableDeclaration('foo', ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword));
        const result = factory.namedDeclarationReflection('foo.__UID__', node, 'foo');
        expect(result).ok();
      });

      it('should reflect named TypeAliasDeclaration', () => {
        const node = ts.createTypeAliasDeclaration(void 0, void 0, 'Foo', void 0, ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword));
        const result = factory.namedDeclarationReflection('Foo.__UID__', node, 'Foo');
        expect(result).ok();
      });

      // should be removed?
      it('should reflect named FunctionTypeNode', () => {
        const node = ts.createFunctionTypeNode(void 0, [], ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword));
        const result = factory.namedDeclarationReflection('foo.__UID__', node);
        expect(result).ok();
      });
    });

    describe('#enumReflection', () => {
      it('should reflect EnumDeclaration', () => {
        const node = ts.createEnumDeclaration(void 0, void 0, 'Foo', [ ts.createEnumMember('foo', ts.createLiteral(0)), ts.createEnumMember('bar') ]);
        const result = factory.enumReflection(node);
        expect(result).ok();
      });
    });

    describe('#enumMemberReflection', () => {
      it('should reflect EnumMember', () => {
        const node = ts.createEnumMember('foo');
        const result = factory.enumMemberReflection(node);
        expect(result).ok();
      });

      it('should reflect EnumMember with numeric initializer', () => {
        const node = ts.createEnumMember('foo', ts.createLiteral(0));
        const result = factory.enumMemberReflection(node);
        expect(result).ok();
      });

      it('should reflect EnumMember with string initializer', () => {
        const node = ts.createEnumMember('foo', ts.createLiteral('bar'));
        const result = factory.enumMemberReflection(node);
        expect(result).ok();
      });
    });

    describe('#variableReflection', () => {
      it('should reflect VariableDeclaration', () => {
        const node = ts.createVariableDeclaration('foo', ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword));
        const result = factory.variableReflection(node);
        expect(result).ok();
      });
    });

    describe('#functionReflection', () => {
      it('should reflect FunctionDeclaration', () => {
        const node = ts.createFunctionDeclaration(void 0, void 0, void 0, 'foo', void 0, [], void 0, ts.createBlock([]));
        const result = factory.functionReflection(node);
        expect(result).ok();
      });
    });

    describe('#returnTypeReflection', () => {
      it('should reflect a return type', () => {
        const node = ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
        const result = factory.returnTypeReflection(node);
        expect(result).ok();
      });
    });

    describe('#typeParameterReflection', () => {
      it('should reflect a TypeParameterDeclaration', () => {
        const node = ts.createTypeParameterDeclaration('foo')
        const result = factory.typeParameterReflection(node);
        expect(result).ok();
      });
    });

    describe('#indexSignatureReflection', () => {
      it('should reflect IndexSignatureDeclaration', () => {
        const node = ts.createIndexSignature(
          void 0,
          void 0,
          [
            ts.createParameter(void 0, void 0, void 0, 'index', void 0, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword))
          ],
          ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        );
        const result = factory.indexSignatureReflection(node);
        expect(result).ok();
      });
    });

    describe('#propertySignatureReflection', () => {
      it('should reflect PropertySignatureDeclaration', () => {
        const node = ts.createPropertySignature(void 0, 'foo', void 0, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), ts.createLiteral(''));
        const result = factory.propertySignatureReflection(node);
        expect(result).ok();
      });
    });

    describe('#propertyReflection', () => {
      it('should reflect PropertyDeclaration', () => {
        const node = ts.createProperty(void 0, void 0, 'foo', void 0, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), ts.createLiteral(''));
        const result = factory.propertyReflection(node);
        expect(result).ok();
      });
    });

    describe('#callSignatureReflection', () => {
      it('should reflect CallSignatureDeclaration', () => {
        const node = ts.createCallSignature(void 0, [], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
        const result = factory.callSignatureReflection(node);
        expect(result).ok();
      });
    });

    describe('#constructSignatureReflection', () => {
      it('should reflect ConstructSignatureDeclaration', () => {
        const node = ts.createConstructSignature(void 0, [], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
        const result = factory.constructSignatureReflection(node);
        expect(result).ok();
      });
    });

    describe('#constructorReflection', () => {
      it('should reflect ConstructorDeclaration', () => {
        const node = ts.createConstructor(void 0, void 0, [], ts.createBlock([]));
        const result = factory.constructorReflection(node);
        expect(result).ok();
      });
    });

    describe('#methodReflection', () => {
      it('should reflect MethodDeclaration', () => {
        const node = ts.createMethod(void 0, void 0, void 0, 'foo', void 0, void 0, [], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), ts.createBlock([]));
        const result = factory.methodReflection(node);
        expect(result).ok();
      });
    });

    describe('#methodSignatureReflection', () => {
      it('should reflect MethodSignatureDeclaration', () => {
        const node = ts.createMethodSignature(void 0, [], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), 'foo', void 0);
        const result = factory.methodSignatureReflection(node);
        expect(result).ok();
      });
    });

    describe('#getAccessorReflection', () => {
      it('should reflect GetAccessorDeclaration', () => {
        const node = ts.createGetAccessor(void 0, void 0, 'foo', [], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), ts.createBlock([]));
        const result = factory.getAccessorReflection(node);
        expect(result).ok();
      });
    });

    describe('#setAccessorReflection', () => {
      it('should reflect SetAccessorDeclaration', () => {
        const node = ts.createSetAccessor(void 0, void 0, 'foo', [], ts.createBlock([]));
        const result = factory.setAccessorReflection(node);
        expect(result).ok();
      });
    });

    describe('#parameterReflection', () => {
      it('should reflect ParameterDeclaration', () => {
        const node = ts.createParameter(void 0, void 0, void 0, 'index', void 0, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword));
        const result = factory.parameterReflection(node);
        expect(result).ok();
      });
    });

    describe('#elementReflection', () => {
      it('should reflect element ConstructorDeclaration', () => {
        const node = ts.createConstructor(void 0, void 0, [], ts.createBlock([]));
        const result = factory.elementReflection(node);
        expect(result).ok();
      });

      it('should reflect element ConstructSignatureDeclaration', () => {
        const node = ts.createConstructSignature(void 0, [], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
        const result = factory.elementReflection(node);
        expect(result).ok();
      });

      it('should reflect element IndexSignatureDeclaration', () => {
        const node = ts.createIndexSignature(
          void 0,
          void 0,
          [
            ts.createParameter(void 0, void 0, void 0, 'index', void 0, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword))
          ],
          ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        );
        const result = factory.elementReflection(node);
        expect(result).ok();
      });

      it('should reflect element PropertyDeclaration', () => {
        const node = ts.createProperty(void 0, void 0, 'foo', void 0, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), ts.createLiteral(''));
        const result = factory.elementReflection(node);
        expect(result).ok();
      });

      it('should reflect element CallSignatureDeclaration', () => {
        const node = ts.createCallSignature(void 0, [], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
        const result = factory.elementReflection(node);
        expect(result).ok();
      });

      it('should reflect element MethodSignatureDeclaration', () => {
        const node = ts.createMethodSignature(void 0, [], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), 'foo', void 0);
        const result = factory.elementReflection(node);
        expect(result).ok();
      });

      it('should reflect element MethodDeclaration', () => {
        const node = ts.createMethod(void 0, void 0, void 0, 'foo', void 0, void 0, [], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), ts.createBlock([]));
        const result = factory.elementReflection(node);
        expect(result).ok();
      });

      it('should reflect element GetAccessorDeclaration', () => {
        const node = ts.createGetAccessor(void 0, void 0, 'foo', [], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), ts.createBlock([]));
        const result = factory.elementReflection(node);
        expect(result).ok();
      });

      it('should reflect element SetAccessorDeclaration', () => {
        const node = ts.createSetAccessor(void 0, void 0, 'foo', [], ts.createBlock([]));
        const result = factory.elementReflection(node);
        expect(result).ok();
      });

      it('should not reflect element Parameter', () => {
        const node = ts.createParameter(void 0, void 0, void 0, 'index', void 0, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword));
        const result = factory.elementReflection(node as any);
        expect(result).to.equal(null);
      });

      it('should throw on other syntax kinds', () => {
        const node = { kind: -1 } as any;
        util.expectProgramError(() => factory.elementReflection(node));
      });
    });

    describe('#elementsReflection', () => {
      it('should reflect an array of elements', () => {
        const node = ts.createConstructor(void 0, void 0, [], ts.createBlock([]));
        const result = factory.elementsReflection([node]);
        expect(result).ok();
      });
    });

    describe('#classTypeParameterSymbolDeclaration', () => {
      it('should return a symbol declaration for a class\'s type parameters', () => {
        const result = factory.classTypeParameterSymbolDeclaration('Foo');
        expect(result).ok();
      });
    });

    describe('#classTypeParameterSymbolConstructorDeclaration', () => {
      it('should return a declaration the constructor of a class, referencing the type parameter symbol', () => {
        const result = factory.classTypeParameterSymbolConstructorDeclaration('Foo');
        expect(result).ok();
      });
    });

    describe('#classTypeParameterSymbolPropertyDeclaration', () => {
      it('should return a static property declaration for a class\'s type parameters', () => {
        const result = factory.classTypeParameterSymbolPropertyDeclaration('Foo');
        expect(result).ok();
      });
    });

    describe('#typeParameterDeclaration', () => {
      it('should reflect TypeParameterDeclaration', () => {
        const node = ts.createTypeParameterDeclaration('foo');
        const result = factory.typeParameterDeclaration(node);
        expect(result).ok();
      });
    });

    describe('#typeParametersLiteral', () => {
      it('should return a declaration for a TypeParameterDeclaration', () => {
        const node = ts.createTypeParameterDeclaration('foo');
        const result = factory.typeParameterDeclaration(node);
        expect(result).ok();
      });
    });

    describe('#typeParametersLiteralDeclaration', () => {
      it('should return a declaration for multiple TypeParameterDeclarations as an object literal', () => {
        const node = ts.createTypeParameterDeclaration('foo');
        const result = factory.typeParametersLiteralDeclaration([node]);
        expect(result).ok();
      });
    });

    describe('#typeParameterBindingDeclaration', () => {
      it('should return a parent class\’s type parameter bindings', () => {
        const node = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        const result = factory.typeParameterBindingDeclaration([node]);
        expect(result).ok();
      });
    });

    describe('#assertReturnStatements', () => {
      it('should assert a return statements of a block', () => {
        const node = ts.createBlock([ ts.createReturn(ts.createLiteral('foo')) ]);
        const result = factory.assertReturnStatements(node);
        expect(result).ok();
      });
    });

    describe('#mutateFunctionBody', () => {
      it('should transform a function body', () => {
        const node = ts.createFunctionDeclaration(void 0, void 0, void 0, 'foo', void 0, [
          ts.createParameter(void 0, void 0, void 0, 'param', void 0, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword))
        ],
        ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ts.createBlock([
          ts.createReturn(ts.createLiteral('foo'))
        ]));
        const result = factory.mutateFunctionBody(node);
        expect(result).ok();
      });
    });

    describe('#propertyNameToLiteralOrExpression', () => {
      it('should return a literal from an identifier', () => {
        const node = ts.createIdentifier('foo');
        const result = factory.propertyNameToLiteralOrExpression(node);
        expect(result).ok();
      });

      it('should return the literal of a string literal', () => {
        const node = ts.createLiteral('foo');
        const result = factory.propertyNameToLiteralOrExpression(node);
        expect(result).ok();
      });

      it('should return the literal of a numeric literal', () => {
        const node = ts.createLiteral(1);
        const result = factory.propertyNameToLiteralOrExpression(node);
        expect(result).ok();
      });

      it('should return the expression of a computed property name', () => {
        const node = ts.createComputedPropertyName(ts.createIdentifier('foo'));
        const result = factory.propertyNameToLiteralOrExpression(node);
        expect(result).ok();
      });

      it('should throw on other syntax kinds', () => {
        const node = { kind: -1 } as any;
        util.expectProgramError(() => factory.propertyNameToLiteralOrExpression(node))
      });
    });

    describe('#declarationNameToLiteralOrExpression', () => {
      it('should return a literal from an identifier', () => {
        const node = ts.createIdentifier('foo');
        const result = factory.declarationNameToLiteralOrExpression(node);
        expect(result).ok();
      });

      it('should return the literal of a string literal', () => {
        const node = ts.createLiteral('foo');
        const result = factory.declarationNameToLiteralOrExpression(node);
        expect(result).ok();
      });

      it('should return the literal of a numeric literal', () => {
        const node = ts.createLiteral(1);
        const result = factory.declarationNameToLiteralOrExpression(node);
        expect(result).ok();
      });

      it('should return the expression of a computed property name', () => {
        const node = ts.createComputedPropertyName(ts.createIdentifier('foo'));
        const result = factory.declarationNameToLiteralOrExpression(node);
        expect(result).ok();
      });

      it('should throw on object binding patterns', () => {
        const node = ts.createObjectBindingPattern([]);
        util.expectProgramError(() => factory.declarationNameToLiteralOrExpression(node))
      });

      it('should throw on array binding patterns', () => {
        const node = ts.createArrayBindingPattern([]);
        util.expectProgramError(() => factory.declarationNameToLiteralOrExpression(node))
      });

      it('should throw on other syntax kinds', () => {
        const node = { kind: -1 } as any;
        util.expectProgramError(() => factory.declarationNameToLiteralOrExpression(node))
      });
    });

    describe('#importLibStatement', () => {
      it('should return the import statement for the lib', () => {
        const result = factory.importLibStatement()
        expect(result).ok();
      });
    });

    describe('#importDeclarationsStatement', () => {
      it('should return the import statement for external and ambient declarations', () => {
        const result = factory.importDeclarationsStatement()
        expect(result).ok();
      });
    });

    describe('#decorate', () => {
      it('should wrap an expression', () => {
        const result = factory.decorate(ts.createIdentifier('foo'));
        expect(result).ok();
      });

      it('should wrap an array of expressions', () => {
        const result = factory.decorate([ts.createIdentifier('foo')]);
        expect(result).ok();
      });
    });

    describe('#annotate', () => {
      it('should wrap an expression', () => {
        const result = factory.annotate(ts.createIdentifier('foo'));
        expect(result).ok();
      });

      it('should wrap an array of expressions', () => {
        const result = factory.annotate([ts.createIdentifier('foo')]);
        expect(result).ok();
      });
    });

    describe('#nullable', () => {
      it('should wrap an expression', () => {
        const result = factory.nullable(ts.createIdentifier('foo'));
        expect(result).ok();
      });
    });

    describe('#nostrict', () => {
      it('should wrap an expression', () => {
        const result = factory.nostrict(ts.createIdentifier('foo'));
        expect(result).ok();
      });
    });

    describe('#intersect', () => {
      it('should wrap an expression', () => {
        const result = factory.intersect(ts.createIdentifier('foo'));
        expect(result).ok();
      });

      it('should wrap an array of expressions', () => {
        const result = factory.intersect([ts.createIdentifier('foo')]);
        expect(result).ok();
      });
    });

    describe('#flowInto', () => {
      it('should wrap an expression', () => {
        const result = factory.flowInto(ts.createIdentifier('foo'));
        expect(result).ok();
      });

      it('should wrap an array of expressions', () => {
        const result = factory.flowInto([ts.createIdentifier('foo')]);
        expect(result).ok();
      });
    });

    describe('#tdz', () => {
      it('should wrap an expression', () => {
        const result = factory.tdz(ts.createIdentifier('foo'), 'foo');
        expect(result).ok();
      });
    });

    describe('#selfReference', () => {
      it('should wrap a concise body', () => {
        const result = factory.selfReference('Foo', ts.createBlock([]));
        expect(result).ok();
      });
    });

    describe('#asObject', () => {
      it('should wrap an array of expressions', () => {
        const result = factory.asObject([ts.createIdentifier('foo')]);
        expect(result).ok();
      });
    });

    describe('#asRef', () => {
      it('should wrap an expression', () => {
        const result = factory.asRef(ts.createIdentifier('foo'));
        expect(result).ok();
      });
    });

    describe('#asType', () => {
      it('should wrap an expression', () => {
        const result = factory.asType('Foo', ts.createIdentifier('foo'));
        expect(result).ok();
      });
    });

    describe('#asClass', () => {
      it('should wrap an expression', () => {
        const result = factory.asClass('Foo', ts.createIdentifier('foo'));
        expect(result).ok();
      });
    });

    describe('#asVar', () => {
      it('should wrap an expression', () => {
        const result = factory.asVar('foo', ts.createIdentifier('foo'));
        expect(result).ok();
      });
    });

    describe('#asStatement', () => {
      it('should wrap an expression', () => {
        const result = factory.asStatement(ts.createIdentifier('foo'));
        expect(result).ok();
      });
    });

    describe('#libCall', () => {
      it('should wrap an expression', () => {
        const result = factory.libCall('boolean', ts.createLiteral(true));
        expect(result).ok();
      });
    });

    describe('#propertyAccessCall', () => {
      it('should wrap an expression', () => {
        const result = factory.propertyAccessCall('t', 'boolean', ts.createLiteral(true));
        expect(result).ok();
      });
    });

    describe('#state', () => {
      it('should check the factory state', () => {
        const result = factory.state(FactoryState.None);
        expect(result).ok();
      });
    });

    describe('#rule', () => {
      it('should check for multiple factory states', () => {
        const result = factory.rule([FactoryState.None]);
        expect(result).ok();
      });
    });

    describe('#match', () => {
      it('should check match a factory state in an array of states', () => {
        const result = factory.match([FactoryState.None], FactoryState.None);
        expect(result).ok();
      });
    });
  });
};
