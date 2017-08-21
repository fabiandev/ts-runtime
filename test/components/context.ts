import * as ts from 'typescript';
import { MutationContext } from '../../src/context';

export default () => {
  describe('Context', () => {
    let input = `let foo: string = "bar";`;
    let context: MutationContext;
    let sf: ts.SourceFile;

    beforeEach(() => {
      const host = util.host(input);
      context = util.context(util.program(host), host);
      sf = context.sourceFile;
    });

    describe('#skip', () => {
      it('should skip a node', () => {
        const input = sf.statements[0];
        const result = context.skip(input);
        expect(result).ok();
      });
    });

    describe('#shouldSkip', () => {
      it('should check if a node should be skipped', () => {
        const input = sf.statements[0];
        const result = context.skip(input);
        const result2 = context.shouldSkip(input);
        expect(result2).to.be(true);
      });
    });

    describe('#dontSkip', () => {
      it('should not skip a node previously marked as skipped', () => {
        const input = sf.statements[0];
        const result = context.skip(input);
        const result2 = context.dontSkip(input);
        const result3 = context.shouldSkip(input);
        expect(result3).to.be(false);
      });
    });

    describe('#isEntryFile', () => {
      it('should return true if path is an entry file', () => {
        const input = context.entryFiles[0];
        const result = context.isEntryFile(input);
        expect(result).to.be(true);
      });

      it('should return false if path is an entry fil', () => {
        const result = context.isEntryFile('');
        expect(result).to.be(false);
      });
    });

    describe('#isImplementationOfOverload', () => {
      before(() => {
        input = `
          class Foo {
            foo(param: string): string;
            foo(param: number): number;
            foo(param: any): any { }
            bar() { }
          }`;
      });

      it('should return true if node is implementation of an overload', () => {
        const i = (sf.statements[0] as ts.ClassDeclaration).members[2];
        const result = context.isImplementationOfOverload(i);
        expect(result).to.be(true);
      });

      it('should return false if node is not implementation of an overload', () => {
        const input = (sf.statements[0] as ts.ClassDeclaration).members[3];
        const result = context.isImplementationOfOverload(input);
        expect(result).to.be(false);
      });
    });

    describe('#isDeclared', () => {
      before(() => {
        input = `
        let foo;
        foo;`;
      });

      it('should return true if an entity name is declared', () => {
        const input = (sf.statements[1] as ts.ExpressionStatement).expression as ts.Identifier;
        const result = context.isDeclared(input);
        expect(result).to.be(true);
      });
    });

    describe('#wasDeclared', () => {
      before(() => {
        input = `
        let foo;
        foo;
        bar;
        let bar;`;
      });

      it('should return true if an entity name was already declared', () => {
        const input = (sf.statements[1] as ts.ExpressionStatement).expression as ts.Identifier;
        const result = context.wasDeclared(input);
        expect(result).to.be(true);
      });

      it('should return false if an entity name was not already declared', () => {
        const input = (sf.statements[2] as ts.ExpressionStatement).expression as ts.Identifier;
        const result = context.wasDeclared(input);
        expect(result).to.be(false);
      });
    });

    describe('#isAny', () => {
      before(() => {
        input = `
        function foo() { }
        function bar(): any { }
        `;
      });

      it('should return true if a node does not have a type annotation', () => {
        const input = sf.statements[0];
        const result = context.isAny(input);
        expect(result).to.be(true);
      });

      it('should return true if a node is annotated with any', () => {
        const input = sf.statements[1];
        const result = context.isAny(input);
        expect(result).to.be(true);
      });
    });

    describe('#isSelfReference', () => {
      before(() => {
        input = `
        type Foo = {
          prop1: Foo;
          prop2: Array;
        }`;
      });

      it('should return true if a type reference is a self reference', () => {
        const input = (((sf.statements[0] as ts.TypeAliasDeclaration).type as ts.TypeLiteralNode).members[0] as ts.PropertySignature).type as ts.TypeReferenceNode;
        const result = context.isSelfReference(input);
        expect(result).to.be(true);
      });

      it('should return false if a type reference is not a self reference', () => {
        const input = (((sf.statements[0] as ts.TypeAliasDeclaration).type as ts.TypeLiteralNode).members[1] as ts.PropertySignature).type as ts.TypeReferenceNode;
        const result = context.isSelfReference(input);
        expect(result).to.be(false);
      });
    });

    // TODO: revisit isSafeAssignment method
    // describe('#isSafeAssignment', () => {
    //   before(() => {
    //     input = `
    //     let foo1: string = 'bar';
    //     let foo2: 'bar' = 'bar';
    //     let foo3: any = 'bar';
    //     let foo3: 'foo' = 'bar' as any;`;
    //   });
    //
    //   it('should return false by default, with assertSafe option set', () => {
    //     const input = sf.statements[0];
    //     const declaration = ((input as ts.VariableStatement).declarationList as ts.VariableDeclarationList).declarations[0];
    //     const node = declaration.name;
    //     const other = declaration.initializer;
    //     const result = context.isSafeAssignment(node, other);
    //     expect(result).to.be(false);
    //   });
    //
    //   it('should return true if an assignment can be considered safe (e.g. string = "bar")', () => {
    //     const input = sf.statements[0];
    //     const declaration = ((input as ts.VariableStatement).declarationList as ts.VariableDeclarationList).declarations[0];
    //     const node = declaration.type;
    //     const other = declaration.initializer;
    //     const result = context.isSafeAssignment(node, other, false, true);
    //     expect(result).to.be(true);
    //   });
    //
    //   it('should return true if an assignment can be considered safe (e.g. "bar" = "bar")', () => {
    //     const input = sf.statements[1];
    //     const declaration = ((input as ts.VariableStatement).declarationList as ts.VariableDeclarationList).declarations[0];
    //     const node = declaration.type;
    //     const other = declaration.initializer;
    //     const result = context.isSafeAssignment(node, other, false, true);
    //     expect(result).to.be(true);
    //   });
    //
    //   it('should return false if an assignment contains any when checked strictly (e.g. any = "bar")', () => {
    //     const input = sf.statements[2];
    //     const declaration = ((input as ts.VariableStatement).declarationList as ts.VariableDeclarationList).declarations[0];
    //     const node = declaration.name;
    //     const other = declaration.initializer;
    //     const result = context.isSafeAssignment(node, other, true, true);
    //     expect(result).to.be(false);
    //   });
    //
    //   it('should return false if an assignment cannot be considered as safe (e.g. "foo" = "bar" as any)', () => {
    //     const input = sf.statements[3];
    //     const declaration = ((input as ts.VariableStatement).declarationList as ts.VariableDeclarationList).declarations[0];
    //     const node = declaration.name;
    //     const other = declaration.initializer;
    //     const result = context.isSafeAssignment(node, other, false, true);
    //     expect(result).to.be(false);
    //   });
    // });

    // TODO: differenciate between hasSelfReference and hasApparentSelfReference
    describe('#hasSelfReference', () => {
      before(() => {
        input = `
        type Foo = {
          prop1: Foo;
          prop2: Array;
        }
        type Bar = {
          prop1: Foo;
          prop2: Array;
        }`;
      });

      it('should return true if a node has a self reference', () => {
        const input = sf.statements[0] as ts.TypeAliasDeclaration;
        const result = context.hasSelfReference(input);
        expect(result).to.be(true);
      });

      it('should return false if a node does not have a self reference', () => {
        const input = sf.statements[1] as ts.TypeAliasDeclaration;
        const result = context.hasSelfReference(input);
        expect(result).to.be(false);
      });
    });

    describe('#hasApparentSelfReference', () => {
      before(() => {
        input = `
        type Foo = {
          prop1: Foo;
          prop2: Array;
        }
        type Bar = {
          prop1: Foo;
          prop2: Array;
        }`;
      });

      it('should return true if a node has a self reference', () => {
        const input = sf.statements[0] as ts.TypeAliasDeclaration;
        const result = context.hasApparentSelfReference(input);
        expect(result).to.be(true);
      });

      it('should return false if a node does not have a self reference', () => {
        const input = sf.statements[1] as ts.TypeAliasDeclaration;
        const result = context.hasApparentSelfReference(input);
        expect(result).to.be(false);
      });
    });

    describe('#hasProperty', () => {
      before(() => {
        input = `
        class Foo {
          prop: string;
        }`;
      });

      it('should return true if a class has a given property name', () => {
        const input = sf.statements[0] as ts.ClassDeclaration;
        const result = context.hasProperty(input, 'prop');
        expect(result).to.be(true);
      });

      it('should return false if a class does not have a given property name', () => {
        const input = sf.statements[0] as ts.ClassDeclaration;
        const result = context.hasProperty(input, 'prop2');
        expect(result).to.be(false);
      });
    });

    describe('#getPropertyName', () => {
      before(() => {
        input = `
        class Foo {
          foo: string;
          prop: string;
          _prop: string;
          __prop_prop: string;
        }`;
      });

      it('should return a unique class property name, based on a given property name', () => {
        const input = sf.statements[0] as ts.ClassDeclaration;
        const result = context.getPropertyName(input, 'foo');
        expect('_foo_foo').to.eql(result);
      });

      it('should always return a unique class property name, based on a given property name', () => {
        const input = sf.statements[0] as ts.ClassDeclaration;
        const result = context.getPropertyName(input, 'prop');
        expect('___prop_prop___prop_prop').to.eql(result);
      });
    });

    describe('#getIdentifier', () => {
      before(() => {
        input = `let foo, _foo;`;
      });

      it('should return a unique identifier', () => {
        const result = context.getIdentifier('foo');
        expect('__foo').to.eql(result);
      });
    });

    describe('#getTypeDeclarationName', () => {
      before(() => {
        input = `let foo, fooType, _fooType;`;
      });

      it('should return a unique type declaration name', () => {
        const options = util.options();
        const result = context.getTypeDeclarationName('foo');
        expect(`${options.declarationPrefix}_fooType`).to.eql(result);
      });
    });

    describe('#getReturnTypeDeclarationName', () => {
      before(() => {
        input = ``;
      });

      it('should return a declaration name for the return type', () => {
        const options = util.options();
        const result = context.getReturnTypeDeclarationName();
        expect(`${options.declarationPrefix}returnType`).to.eql(result);
      });
    });

    describe('#getLibDeclarationName', () => {
      before(() => {
        input = `let t, _t;`;
      });

      it('should return the unique lib identifier', () => {
        const options = util.options();
        const result = context.getLibDeclarationName();
        expect(`${context.options.libNamespace}__${context.options.libIdentifier}`).to.eql(result);
      });
    });

    describe('#getTypeSymbolDeclarationName', () => {
      it('should return a unique declaration name for a type\'s type parameters symbol', () => {
        const options = util.options();
        const result = context.getTypeSymbolDeclarationName('Foo');
        expect(`${options.declarationPrefix}FooTypeParametersSymbol`).to.eql(result);
      });
    });

    describe('#getTypeSymbolDeclarationInitializer', () => {
      it('should return the initializer for a type\'s type parameters symbol', () => {
        const options = util.options();
        const result = context.getTypeSymbolDeclarationInitializer('Foo');
        expect(`FooTypeParameters`).to.eql(result);
      });
    });

    describe('#getTypeParametersDeclarationName', () => {
      it('get the declaration name for type parameters', () => {
        const options = util.options();
        const result = context.getTypeParametersDeclarationName();
        expect(`${options.declarationPrefix}typeParameters`).to.eql(result);
      });
    });

    describe('#getMembers', () => {
      before(() => {
        input = `
        interface Foo {
          prop: string;
        }
        interface Foo {
          prop2: string;
        }
        class Foo {
          prop3: string;
        }`;
      });

      it('should get the merged members of a type by an interface', () => {
        const input = sf.statements[0] as ts.InterfaceDeclaration;
        const result = context.getMembers(input);
        expect(result.length).to.be(3);
      });

      it('should get the merged members of a type by a class', () => {
        const input = sf.statements[2] as ts.ClassDeclaration;
        const result = context.getMembers(input);
        expect(result.length).to.be(3);
      });
    });

    describe('#setMerged', () => {
      before(() => {
        input = `
        interface Foo {
          prop: string;
        }`;
      });

      it('should mark a node symbol as merged', () => {
        const input = context.scanner.getNodeSymbol(sf.statements[0]);
        const result = context.setMerged(input);
        expect(result).ok();
      });
    });

    describe('#wasMerged', () => {
      before(() => {
        input = `
        interface Foo {
          prop: string;
        }
        interface Bar {
          prop: string;
        }`;
      });

      it('should recognize a merged node symbol', () => {
        const input = context.scanner.getNodeSymbol(sf.statements[0]);
        const result1 = context.setMerged(input);
        const result2 = context.wasMerged(input);
        expect(result2).to.be(true);
      });

      it('should return false if a node symbol was not marked as merged', () => {
        const input1 = context.scanner.getNodeSymbol(sf.statements[0]);
        const input2 = context.scanner.getNodeSymbol(sf.statements[0]);
        const result1 = context.setMerged(input1);
        const result2 = context.wasMerged(input2);
        expect(result2).to.be(true);
      });
    });

    describe('#sourceFile', () => {
      it('should get the current source file', () => {
        const result = context.sourceFile;
        expect(result.kind).to.be(ts.SyntaxKind.SourceFile);
      });

      it('should set a new source file', () => {
        context.sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.ES2015, true);
        const result = context.sourceFile;
        expect(result.kind).to.be(ts.SyntaxKind.SourceFile);
      });

      it('should throw when attempting to set an object that is not a source file', () => {
        util.expectProgramError(() => context.sourceFile = {} as any);
      });
    });

    describe('#transformationContext', () => {
      it('should get the transformation context', () => {
        const result = context.transformationContext;
        expect(result).to.equal(context.transformationContext);
      });

      it('should set the transformation context', () => {
        context.transformationContext = context.transformationContext;
      });
    });

    describe('#compilerOptions', () => {
      it('should get the compiler options', () => {
        const result = context.compilerOptions;
        expect(result).ok();
      });
    });

    describe('#options', () => {
      it('should get the options', () => {
        const result = context.options;
        expect(result).ok();
      });
    });

    describe('#program', () => {
      it('should get the program', () => {
        const result = context.program;
        expect(result).ok();
      });
    });

    describe('#checker', () => {
      it('should get the checker', () => {
        const result = context.checker;
        expect(result).ok();
      });
    });

    describe('#host', () => {
      it('should get the compiler host', () => {
        const result = context.host;
        expect(result).ok();
      });
    });

    describe('#scanner', () => {
      it('should get the scanner', () => {
        const result = context.scanner;
        expect(result).ok();
      });
    });

    describe('#factory', () => {
      it('should get the factory', () => {
        const result = context.factory;
        expect(result).ok();
      });
    });

    describe('#map', () => {
      before(() => {
        input = `
        let foo;
        let bar;`;
      });

      it('should map a node to another node', () => {
        const result = context.map(sf.statements[0], sf.statements[1]);
        expect(result).ok();
      });

      it('should retrieve a mapped node', () => {
        const result = context.map(sf.statements[0], sf.statements[1]);
        const node1 = context.scanner.getNode(sf.statements[0]);
        const node2 = context.scanner.getNode(sf.statements[0]);
        expect(node1).to.equal(node2);
        expect(node1).to.equal(sf.statements[1]);
        expect(node2).to.equal(sf.statements[1]);
      });
    });

    describe('#entryFiles', () => {
      it('should get the entry files', () => {
        const result = context.entryFiles;
        expect(result).to.be.a('array');
      });
    });

    describe('#commonDir', () => {
      it('should get the common directory', () => {
        const result = context.commonDir;
        expect(result).to.be.a('string');
      });
    });
  });
};
