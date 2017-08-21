import * as ts from 'typescript';
import * as u from '../../src/util';

export default () => {
  describe('Util', () => {
    describe('#asArray', () => {
      it('should return an array from a value', () => {
        const input = 1;
        const result = u.asArray(input);
        expect(Array.isArray(result)).ok();
      });

      it('should return an array from an array', () => {
        const input = [1];
        const result = u.asArray(input);
        expect(Array.isArray(result)).ok();
        expect(input === result).ok();
      });
    });

    describe('#asNewArray', () => {
      it('should return an array from a value', () => {
        const input = 1;
        const result = u.asNewArray(input);
        expect(Array.isArray(result)).ok();
      });

      it('should return an array from an array', () => {
        const input = [1];
        const result = u.asNewArray(input);
        expect(Array.isArray(result)).ok();
        expect(input !== result).ok();
      });
    });

    describe('#arrayFromNodeArray', () => {
      it('should return an array from a NodeArray', () => {
        const input = ts.createNodeArray([ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)]) as any;
        const result = u.arrayFromNodeArray(input) as any;
        expect(Array.isArray(result)).ok();
        expect(input !== result).ok();
      });
    });

    describe('#hasTypeParameters', () => {
      it('should be true if node has type parameters', () => {
        const input = ts.createInterfaceDeclaration(void 0, void 0, 'Foo', [ ts.createTypeParameterDeclaration('T') ], void 0, []);
        const result = u.hasTypeParameters(input) as any;
        expect(result).to.be(true);
      });

      it('should be false if node has no type parameters', () => {
        const input = ts.createInterfaceDeclaration(void 0, void 0, 'Foo', void 0, void 0, []);
        const result = u.hasTypeParameters(input) as any;
        expect(result).to.be(false);
      });
    });

    describe('#hasProperty', () => {
      it('should be true if object has own property', () => {
        const input = { prop: 1 };
        const result = u.hasProperty(input, 'prop');
        expect(result).to.be(true);
      });

      it('should be false if object does not have own property', () => {
        const input = { };
        const result = u.hasProperty(input, 'prop');
        expect(result).to.be(false);
      });
    });

    describe('#hasArrayProperty', () => {
      it('should be true if object has own property that is an array', () => {
        const input = { prop: [1] };
        const result = u.hasArrayProperty(input, 'prop');
        expect(result).to.be(true);
      });

      it('should be false if object does not have own property', () => {
        const input = { };
        const result = u.hasArrayProperty(input, 'prop');
        expect(result).to.be(false);
      });

      it('should be false if object has own property but it is not an array', () => {
        const input = { prop: 1 };
        const result = u.hasArrayProperty(input, 'prop');
        expect(result).to.be(false);
      });
    });

    describe('#hasNonEmptyArrayProperty', () => {
      it('should be true if object has own property that is an non-empty array', () => {
        const input = { prop: [1] };
        const result = u.hasNonEmptyArrayProperty(input, 'prop');
        expect(result).to.be(true);
      });

      it('should be false if object does not have own property', () => {
        const input = { };
        const result = u.hasNonEmptyArrayProperty(input, 'prop');
        expect(result).to.be(false);
      });

      it('should be false if object has own property but it is not an array', () => {
        const input = { prop: 1 };
        const result = u.hasNonEmptyArrayProperty(input, 'prop');
        expect(result).to.be(false);
      });

      it('should be false if object has own property but it is an empty array', () => {
        const input = { prop: [] } as any;
        const result = u.hasNonEmptyArrayProperty(input, 'prop');
        expect(result).to.be(false);
      });
    });

    describe('#hasKind', () => {
      it('should be false if node does not include kind', () => {
        const result = u.hasKind(ts.createThis(), ts.SyntaxKind.AnyKeyword);
        expect(result).to.be(false);
      });

      it('should be true if node is of kind', () => {
        const result = u.hasKind(ts.createThis(), ts.SyntaxKind.ThisKeyword);
        expect(result).to.be(true);
      });

      it('should be true if node includes kind', () => {
        const result = u.hasKind(ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), ts.SyntaxKind.AnyKeyword);
        expect(result).to.be(true);
      });
    });

    describe('#hasModifier', () => {
      it('should be true if node has modifier flag', () => {
        const input = ts.createInterfaceDeclaration(void 0, [ts.createToken(ts.SyntaxKind.AbstractKeyword)], 'Foo', void 0, void 0, []);
        const result = u.hasModifier(input, ts.SyntaxKind.AbstractKeyword);
        expect(result).to.be(true);
      });

      it('should be false if node does not have modifier flag', () => {
        const input = ts.createInterfaceDeclaration(void 0, void 0, 'Foo', void 0, void 0, []);
        const result = u.hasModifier(input, ts.SyntaxKind.AbstractKeyword);
        expect(result).to.be(false);
      });
    });

    describe('#hasFlag', () => {
      it('should be true if node has flag', () => {
        const input = ts.createInterfaceDeclaration(void 0, [ts.createToken(ts.SyntaxKind.AbstractKeyword)], 'Foo', void 0, void 0, []);
        const result = u.hasFlag(input, ts.NodeFlags.Synthesized);
        expect(result).to.be(true);
      });

      it('should be false if node does not have flag', () => {
        const input = ts.createInterfaceDeclaration(void 0, void 0, 'Foo', void 0, void 0, []);
        const result = u.hasFlag(input, ts.NodeFlags.Const);
        expect(result).to.be(false);
      });
    });

    describe('#setParent', () => {
      it('should set parent nodes recursively', () => {
        const input = ts.createThis();
        const result = u.setParent(input);
        expect(result).ok();
      });
    });

    describe('#isAnyKeyword', () => {
      it('should be true if node kind is AnyKeyword', () => {
        const input = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        const result = u.isAnyKeyword(input);
        expect(result).to.be(true);
      });

      it('should be false if node kind is not AnyKeyword', () => {
        const input = ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
        const result = u.isAnyKeyword(input);
        expect(result).to.be(false);
      });
    });

    describe('#isSynthesized', () => {
      it('should be true if node is synthesized', () => {
        const input = ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
        const result = u.isSynthesized(input);
        expect(result).to.be(true);
      });
    });

    describe('#isAmbient', () => {
      it('should be true for interface declarations', () => {
        const input = ts.createInterfaceDeclaration(void 0, void 0, 'Foo', void 0, void 0, []);
        const result = u.isAmbient(input);
        expect(result).to.be(true);
      });

      it('should be true for type alias declarations', () => {
        const input = ts.createTypeAliasDeclaration(void 0, void 0, 'Foo', void 0, ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
        const result = u.isAmbient(input);
        expect(result).to.be(true);
      });

      it('should be false for other declarations', () => {
        const input = ts.createClassDeclaration(void 0, void 0, 'Foo', void 0, void 0, []);
        const result = u.isAmbient(input);
        expect(result).to.be(false);
      });
    });

    describe('#isAmbientDeclaration', () => {
      it('should be true for declaration with declare keyword', () => {
        const input = ts.createClassDeclaration(void 0, [ts.createToken(ts.SyntaxKind.DeclareKeyword)], 'Foo', void 0, void 0, []);
        const result = u.isAmbientDeclaration(input);
        expect(result).to.be(true);
      });

      it('should be false for other declarations', () => {
        const input = ts.createClassDeclaration(void 0, void 0, 'Foo', void 0, void 0, []);
        const result = u.isAmbientDeclaration(input);
        expect(result).to.be(false);
      });
    });

    describe('#isPartOfTypeNode', () => {
      it('should be false if node has no parent', () => {
        const input = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        const result = u.isPartOfTypeNode(input);
        expect(result).to.be(false);
      });

      it('should be true if node is child of a type node', () => {
        const input = ts.createArrayTypeNode(ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
        u.setParent(input);
        const result = u.isPartOfTypeNode(input.elementType);
        expect(result).to.be(true);
      });
    });

    describe('#isBindingPattern', () => {
      it('should be true for array binding patterns', () => {
        const input = ts.createArrayBindingPattern([]);
        const result = u.isBindingPattern(input);
        expect(result).to.be(true);
      });

      it('should be true for object binding patterns', () => {
        const input = ts.createObjectBindingPattern([]);
        const result = u.isBindingPattern(input);
        expect(result).to.be(true);
      });

      it('should be false if it is no binding pattern', () => {
        const input = ts.createThis();
        const result = u.isBindingPattern(input);
        expect(result).to.be(false);
      });
    });

    describe('#isStatic', () => {
      it('should be true if it has a static modifier', () => {
        const input = ts.createMethod(void 0, [ts.createToken(ts.SyntaxKind.StaticKeyword)], void 0, 'foo', void 0, void 0, [], void 0, ts.createBlock([]));
        const result = u.isStatic(input);
        expect(result).to.be(true);
      });

      it('should be false if it has no static modifier', () => {
        const input = ts.createMethod(void 0, void 0, void 0, 'foo', void 0, void 0, [], void 0, ts.createBlock([]));
        const result = u.isStatic(input);
        expect(result).to.be(false);
      });
    });

    describe('#isTypeParameter', () => {
      it('should be true if type reference is a type parameter', () => {
        const node = ts.createClassDeclaration(void 0, void 0, 'Foo', [ ts.createTypeParameterDeclaration('T') ], void 0, [
          ts.createProperty(void 0, void 0, 'foo', void 0, ts.createTypeReferenceNode('T', void 0), void 0)
        ]);
        const input = (node.members[0] as ts.PropertyDeclaration).type as ts.TypeReferenceNode;
        u.setParent(node);
        const result = u.isTypeParameter(input);
        expect(result).to.be(true);
      });

      it('should be false if type reference is not a type parameter', () => {
        const node = ts.createClassDeclaration(void 0, void 0, 'Foo', [ ts.createTypeParameterDeclaration('T') ], void 0, [
          ts.createProperty(void 0, void 0, 'foo', void 0, ts.createTypeReferenceNode('Bar', void 0), void 0)
        ]);
        const input = (node.members[0] as ts.PropertyDeclaration).type as ts.TypeReferenceNode;
        u.setParent(node);
        const result = u.isTypeParameter(input);
        expect(result).to.be(false);
      });
    });

    describe('#isTypeParameterOf', () => {
      it('should be true if type reference is a type parameter', () => {
        const node = ts.createClassDeclaration(void 0, void 0, 'Foo', [ ts.createTypeParameterDeclaration('T') ], void 0, [
          ts.createProperty(void 0, void 0, 'foo', void 0, ts.createTypeReferenceNode('T', void 0), void 0)
        ]);
        const input = (node.members[0] as ts.PropertyDeclaration).type as ts.TypeReferenceNode;
        u.setParent(node);
        const result = u.isTypeParameterOf(input, u.arrayFromNodeArray(node.typeParameters));
        expect(result).to.be(true);
      });

      it('should be false if type reference is not a type parameter', () => {
        const node = ts.createClassDeclaration(void 0, void 0, 'Foo', [ ts.createTypeParameterDeclaration('T') ], void 0, [
          ts.createProperty(void 0, void 0, 'foo', void 0, ts.createTypeReferenceNode('Bar', void 0), void 0)
        ]);
        const input = (node.members[0] as ts.PropertyDeclaration).type as ts.TypeReferenceNode;
        u.setParent(node);
        const result = u.isTypeParameterOf(input, u.arrayFromNodeArray(node.typeParameters));
        expect(result).to.be(false);
      });
    });

    describe('#isTypeParameterOfClass', () => {
      it('should return the class node if it is a class type parameter', () => {
        const node = ts.createClassDeclaration(void 0, void 0, 'Foo', [ ts.createTypeParameterDeclaration('T') ], void 0, [
          ts.createProperty(void 0, void 0, 'foo', void 0, ts.createTypeReferenceNode('T', void 0), void 0)
        ]);
        const input = (node.members[0] as ts.PropertyDeclaration).type as ts.TypeReferenceNode;
        u.setParent(node);
        const result = u.isTypeParameterOfClass(input);
        expect(ts.isClassDeclaration(result)).to.be(true);
      });

      it('should return null if it is not a class type parameter', () => {
        const node = ts.createInterfaceDeclaration(void 0, void 0, 'Foo', [ ts.createTypeParameterDeclaration('T') ], void 0, [
          ts.createPropertySignature(void 0, 'foo', void 0, ts.createTypeReferenceNode('Bar', void 0), void 0)
        ]);
        const input = (node.members[0] as ts.PropertySignature).type as ts.TypeReferenceNode;
        u.setParent(node);
        const result = u.isTypeParameterOfClass(input);
        expect(result).to.be(null);
      });
    });

    describe('#isInStaticContext', () => {
      it('should be true if node is in a static context', () => {
        const input = ts.createMethod(void 0, [
          ts.createToken(ts.SyntaxKind.StaticKeyword)
        ], void 0, 'foo', void 0, void 0, [], ts.createTypeReferenceNode('Bar', void 0), ts.createBlock([]));
        u.setParent(input);
        const result = u.isInStaticContext(input.type as ts.TypeReferenceNode);
        expect(result).to.be(true);
      });

      it('should be false if node is not in a static context', () => {
        const input = ts.createMethod(void 0, void 0, void 0, 'foo', void 0, void 0, [], ts.createTypeReferenceNode('Bar', void 0), ts.createBlock([]));
        u.setParent(input);
        const result = u.isInStaticContext(input.type as ts.TypeReferenceNode);
        expect(result).to.be(false);
      });
    });

    describe('#isSuperStatement', () => {
      it('should be true if node is a super call expression statement', () => {
        const input = ts.createStatement(ts.createCall(ts.createSuper(), void 0, void 0))
        const result = u.isSuperStatement(input);
        expect(result).to.be(true);
      });

      it('should be false if node is not a super call expression statement', () => {
        const input = ts.createSuper();
        const result = u.isSuperStatement(input);
        expect(result).to.be(false);
      });
    });

    describe('#isKind', () => {
      it('should be true if node is of kind', () => {
        const input = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        const result = u.isKind(input, ts.SyntaxKind.AnyKeyword);
        expect(result).to.be(true);
      });

      it('should be false if node is not of kind', () => {
        const input = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        const result = u.isKind(input, ts.SyntaxKind.NumberKeyword);
        expect(result).to.be(false);
      });
    });

    describe('#isBindingName', () => {
      it('should be true for identifiers', () => {
        const input = ts.createIdentifier('foo');
        const result = u.isBindingName(input);
        expect(result).to.be(true);
      });

      it('should be true for array binding patterns', () => {
        const input = ts.createArrayBindingPattern([]);
        const result = u.isBindingName(input);
        expect(result).to.be(true);
      });

      it('should be true for object binding patterns', () => {
        const input = ts.createObjectBindingPattern([]);
        const result = u.isBindingName(input);
        expect(result).to.be(true);
      });

      it('should be false for other syntax kinds', () => {
        const input = ts.createThis();
        const result = u.isBindingName(input);
        expect(result).to.be(false);
      });
    });

    describe('#isLiteral', () => {
      it('should be true for LiteralTypenNode', () => {
        const input = ts.createLiteralTypeNode(ts.createLiteral('foo'));
        const result = u.isLiteral(input);
        expect(result).to.be(true);
      });

      it('should be true for NumericLiteral', () => {
        const input = ts.createLiteral(1);
        const result = u.isLiteral(input);
        expect(result).to.be(true);
      });

      it('should be true for StringLiteral', () => {
        const input = ts.createLiteral('foo');
        const result = u.isLiteral(input);
        expect(result).to.be(true);
      });

      it('should be true for TrueKeyword', () => {
        const input = ts.createLiteral(true);
        const result = u.isLiteral(input);
        expect(result).to.be(true);
      });

      it('should be true for FalseKeyword', () => {
        const input = ts.createLiteral(false);
        const result = u.isLiteral(input);
        expect(result).to.be(true);
      });

      it('should be false for other types', () => {
        const input = ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
        const result = u.isLiteral(input);
        expect(result).to.be(false);
      });
    });

    describe('#getHash', () => {
      it('should return a number hash from a string', () => {
        const result = u.getHash('');
        expect(result).to.be.a('number');
      });
    });

    describe('#getHashedDeclarationName', () => {
      it('should return declaration name including a number hash as a string', () => {
        const result = u.getHashedDeclarationName('foo', '');
        expect(result).to.be.a('string');
      });
    });

    describe('#getIdentifierOfEntityName', () => {
      it('should return the identifier', () => {
        const input = ts.createIdentifier('foo');
        const result = u.getIdentifierOfEntityName(input);
        expect(ts.isIdentifier(result)).to.be(true);
      });

      it('should return the right hand identifier side of a qualified name', () => {
        const input = ts.createQualifiedName(ts.createIdentifier('foo'), ts.createIdentifier('bar'));
        const result = u.getIdentifierOfEntityName(input);
        expect(ts.isIdentifier(result)).to.be(true);
        expect(result.text).to.eql('bar');
      });
    });

    describe('#getBaseIdentifierOfEntityName', () => {
      it('should return the identifier', () => {
        const input = ts.createIdentifier('foo');
        const result = u.getBaseIdentifierOfEntityName(input);
        expect(ts.isIdentifier(result)).to.be(true);
      });

      it('should return the left hand side identifier of a qualified name', () => {
        const input = ts.createQualifiedName(ts.createIdentifier('foo'), ts.createIdentifier('bar'));
        const result = u.getBaseIdentifierOfEntityName(input);
        expect(ts.isIdentifier(result)).to.be(true);
        expect(result.text).to.eql('foo');
      });
    });

    describe('#getExtendsClause', () => {
      it('should return the extends heritage clause', () => {
        const input = ts.createClassDeclaration(void 0, void 0, 'Foo', void 0, [
          ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [ts.createExpressionWithTypeArguments(void 0, ts.createIdentifier('Bar'))]),
          ts.createHeritageClause(ts.SyntaxKind.ImplementsKeyword, [ts.createExpressionWithTypeArguments(void 0, ts.createIdentifier('IFoo'))])
        ], []);
        const clause = input.heritageClauses[0];
        u.setParent(input);
        const result = u.getExtendsClause(input);
        expect(result).to.equal(clause);
      });
    });

    describe('#getImplementsClause', () => {
      it('should return the implements heritage clause', () => {
        const input = ts.createClassDeclaration(void 0, void 0, 'Foo', void 0, [
          ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [ts.createExpressionWithTypeArguments(void 0, ts.createIdentifier('Bar'))]),
          ts.createHeritageClause(ts.SyntaxKind.ImplementsKeyword, [ts.createExpressionWithTypeArguments(void 0, ts.createIdentifier('IFoo'))])
        ], []);
        const clause = input.heritageClauses[1];
        u.setParent(input);
        const result = u.getImplementsClause(input);
        expect(result).to.equal(clause);
      });
    });

    describe('#getExpression', () => {
      it('should return the first expression of a node', () => {
        const input = ts.createExpressionWithTypeArguments(void 0, ts.createIdentifier('Bar'));
        const result = u.getExpression(input);
        expect(ts.isIdentifier(result)).to.be(true);
      });
    });

    describe('#getPropertyAccessExpressionTextOrFail', () => {
      it('should return the text of a property access expression', () => {
        const input = ts.createPropertyAccess(ts.createIdentifier('foo'), ts.createIdentifier('bar'));
        const result = u.getPropertyAccessExpressionTextOrFail(input);
        expect(result).to.eql('foo.bar');
      });

      it('should fail if property access expression does not consist of identifiers', () => {
        const input = ts.createPropertyAccess(ts.createCall(ts.createIdentifier('foo'), void 0, void 0), ts.createIdentifier('bar'));
        util.expectProgramError(() => u.getPropertyAccessExpressionTextOrFail(input));
      });
    });

    describe('#getIdentifierOfPropertyAccessExpressionOrFail', () => {
      it('should return the text of a property access expression', () => {
        const input = ts.createPropertyAccess(ts.createIdentifier('foo'), ts.createIdentifier('bar'));
        const result = u.getIdentifierOfPropertyAccessExpressionOrFail(input);
        expect(result.text).to.eql('foo');
      });

      it('should fail if property access expression does not consist of identifiers', () => {
        const input = ts.createPropertyAccess(ts.createCall(ts.createIdentifier('foo'), void 0, void 0), ts.createIdentifier('bar'));
        util.expectProgramError(() => u.getIdentifierOfPropertyAccessExpressionOrFail(input));
      });
    });

    describe('#getEntityNameText', () => {
      it('should return the identifier text if the entity name is an identifier', () => {
        const input = ts.createIdentifier('foo');
        const result = u.getEntityNameText(input);
        expect(result).to.eql('foo');
      });

      it('should return the text of a qualified name', () => {
        const input = ts.createQualifiedName(ts.createIdentifier('foo'), ts.createIdentifier('bar'));
        const result = u.getEntityNameText(input);
        expect(result).to.eql('foo.bar');
      });
    });

    describe('#insertBeforeSuper', () => {
      it('should insert a statement before the super call', () => {
        const statements = [ts.createStatement(ts.createCall(ts.createSuper(), void 0, void 0))];
        const insert = ts.createStatement(ts.createIdentifier('foo'));
        const result = u.insertBeforeSuper(statements, insert);
        expect(result[0]).to.equal(insert);
      });
    });

    describe('#insertAfterSuper', () => {
      it('should insert a statement after the super call', () => {
        const statements = [ts.createStatement(ts.createCall(ts.createSuper(), void 0, void 0))];
        const insert = ts.createStatement(ts.createIdentifier('foo'));
        const result = u.insertAfterSuper(statements, insert);
        expect(result[1]).to.equal(insert);
      });
    });

    describe('#declarationCanHaveTypeAnnotation', () => {
      it('should return false for nodes in for-of statements', () => {
        const input = ts.createForOf(void 0, ts.createVariableDeclarationList([ts.createVariableDeclaration('foo')]), ts.createArrayLiteral(), ts.createStatement(ts.createIdentifier('bar')));
        u.setParent(input);
        const result = u.declarationCanHaveTypeAnnotation(input.initializer);
        expect(result).to.be(false);
      });

      it('should return false for nodes in for-in statements', () => {
        const input = ts.createForIn(ts.createVariableDeclarationList([ts.createVariableDeclaration('foo')]), ts.createObjectLiteral(), ts.createStatement(ts.createIdentifier('bar')));
        u.setParent(input);
        const result = u.declarationCanHaveTypeAnnotation((input.initializer as ts.VariableDeclarationList).declarations[0]);
        expect(result).to.be(false);
      });

      it('should return false for nodes in catch clauses', () => {
        const input = ts.createTry(ts.createBlock([]), ts.createCatchClause('e', ts.createBlock([])), void 0);
        u.setParent(input);
        const result = u.declarationCanHaveTypeAnnotation(input.catchClause.variableDeclaration);
        expect(result).to.be(false);
      });

      it('should return false for import clauses', () => {
        const input = ts.createImportDeclaration(void 0, void 0, ts.createImportClause(ts.createIdentifier('foo'), void 0), ts.createLiteral('foo'))
        u.setParent(input);
        const result = u.declarationCanHaveTypeAnnotation(input.importClause);
        expect(result).to.be(false);
      });

      it('should return true for other declarations', () => {
        const input = ts.createVariableDeclarationList([ts.createVariableDeclaration('foo')])
        const result = u.declarationCanHaveTypeAnnotation(input);
        expect(result).to.be(true);
      });
    });

    describe('#extendsClauseHasTypeArguments', () => {
      it('should return true if the extends clause has type arguments', () => {
        const input = ts.createClassDeclaration(void 0, void 0, 'Foo', void 0, [
          ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [ts.createExpressionWithTypeArguments([ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)], ts.createIdentifier('Bar'))]),
          ts.createHeritageClause(ts.SyntaxKind.ImplementsKeyword, [ts.createExpressionWithTypeArguments(void 0, ts.createIdentifier('IFoo'))])
        ], []);
        const clause = input.heritageClauses[0];
        u.setParent(input);
        const result = u.extendsClauseHasTypeArguments(clause);
        expect(result).to.be(true);
      });
    });

    describe('#canHaveType', () => {
      it('should be true for VariableDeclaration', () => {
        const input = { kind: ts.SyntaxKind.VariableDeclaration };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for ObjectBindingPattern', () => {
        const input = { kind: ts.SyntaxKind.ObjectBindingPattern };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for ArrayBindingPattern', () => {
        const input = { kind: ts.SyntaxKind.ArrayBindingPattern };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for ParameterDeclaration', () => {
        const input = { kind: ts.SyntaxKind.Parameter };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for PropertySignature', () => {
        const input = { kind: ts.SyntaxKind.PropertySignature };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for PropertyDeclaration', () => {
        const input = { kind: ts.SyntaxKind.PropertyDeclaration };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for MethodSignature', () => {
        const input = { kind: ts.SyntaxKind.MethodSignature };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for CallSignature', () => {
        const input = { kind: ts.SyntaxKind.CallSignature };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for ConstructSignature', () => {
        const input = { kind: ts.SyntaxKind.ConstructSignature };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for IndexSignature', () => {
        const input = { kind: ts.SyntaxKind.IndexSignature };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for MethodDeclaration', () => {
        const input = { kind: ts.SyntaxKind.MethodDeclaration };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for GetAccessor', () => {
        const input = { kind: ts.SyntaxKind.GetAccessor };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for FunctionExpression', () => {
        const input = { kind: ts.SyntaxKind.FunctionExpression };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for ArrowFunction', () => {
        const input = { kind: ts.SyntaxKind.ArrowFunction };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for FunctionDeclaration', () => {
        const input = { kind: ts.SyntaxKind.FunctionDeclaration };
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should be true for other kinds', () => {
        const input = { kind: -1 };
        const result = u.canHaveType(input);
        expect(result).to.be(false);
      });
    });

    describe('#annotateWithAny', () => {
      it('should annotate VariableDeclaration', () => {
        const input = { kind: ts.SyntaxKind.VariableDeclaration } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(true);
      });

      it('should annotate ObjectBindingPattern', () => {
        const input = { kind: ts.SyntaxKind.ObjectBindingPattern } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(true);
      });

      it('should annotate ArrayBindingPattern', () => {
        const input = { kind: ts.SyntaxKind.ArrayBindingPattern } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(true);
      });

      it('should annotate ParameterDeclaration', () => {
        const input = { kind: ts.SyntaxKind.Parameter } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(true);
      });

      it('should annotate PropertySignature', () => {
        const input = { kind: ts.SyntaxKind.PropertySignature } as any;
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should annotate PropertyDeclaration', () => {
        const input = { kind: ts.SyntaxKind.PropertyDeclaration } as any;
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should annotate MethodSignature', () => {
        const input = { kind: ts.SyntaxKind.MethodSignature } as any;
        const result = u.canHaveType(input);
        expect(result).to.be(true);
      });

      it('should annotate CallSignature', () => {
        const input = { kind: ts.SyntaxKind.CallSignature } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(true);
      });

      it('should annotate ConstructSignature', () => {
        const input = { kind: ts.SyntaxKind.ConstructSignature } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(true);
      });

      it('should annotate IndexSignature', () => {
        const input = { kind: ts.SyntaxKind.IndexSignature } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(true);
      });

      it('should annotate MethodDeclaration', () => {
        const input = { kind: ts.SyntaxKind.MethodDeclaration } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(true);
      });

      it('should annotate GetAccessor', () => {
        const input = { kind: ts.SyntaxKind.GetAccessor } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(true);
      });

      it('should annotate FunctionExpression', () => {
        const input = { kind: ts.SyntaxKind.FunctionExpression } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(true);
      });

      it('should annotate ArrowFunction', () => {
        const input = { kind: ts.SyntaxKind.ArrowFunction } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(true);
      });

      it('should annotate FunctionDeclaration', () => {
        const input = { kind: ts.SyntaxKind.FunctionDeclaration } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(true);
      });

      it('should not annotate other kinds', () => {
        const input = { kind: -1 } as any;
        const result = u.annotateWithAny(input);
        expect(result).to.be(false);
      });
    });
  });
};
