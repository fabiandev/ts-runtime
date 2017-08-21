import * as ts from 'typescript';
import { Scanner } from '../../src/scanner';
import { MutationContext } from '../../src/context';

export default () => {
  describe('Scanner', () => {
    let input = `let foo: string = "bar";`;
    let context: MutationContext;
    let scanner: Scanner;
    let sf: ts.SourceFile;
    let id: ts.Identifier;

    beforeEach(() => {
      input = `
      let foo: string = "bar";
      let bar: string = "bar";
      `;
      const host = util.host(input);
      context = util.context(util.program(host), host);
      sf = context.sourceFile;
      scanner = context.scanner;
      id = (sf.statements[0] as ts.VariableStatement).declarationList.declarations[0].name as ts.Identifier;
    });

    describe('#scan', () => {
      it('should already be tested by other components', () => {
        // Tested in every application pass
      });
    });

    describe('#mapNode', () => {
      it('should map a node to another node', () => {
        const result = scanner.mapNode(sf.statements[0], sf.statements[1]);
        expect(result).ok();
      });

      it('should be possible to retrieve a mapped node', () => {
        const result = scanner.mapNode(sf.statements[0], sf.statements[1]);
        const node1 = scanner.getNode(sf.statements[0]);
        const node2 = scanner.getNode(sf.statements[0]);
        expect(node1).to.equal(node2);
        expect(node1).to.equal(sf.statements[1]);
        expect(node2).to.equal(sf.statements[1]);
      });
    });

    describe('#getTypeInfo', () => {
      it('should retrieve the type info for a node', () => {
        const result = scanner.getTypeInfo(id);
        expect(result).ok();
      });
    });

    describe('#getNodeSymbol', () => {
      it('should retrieve the symbol od a node', () => {
        const result = scanner.getNodeSymbol(id);
        expect(result).ok();
      });
    });

    describe('#hasNodeSymbol', () => {
      it('should check of a symbol is available for a node', () => {
        const result = scanner.getNodeSymbol(id);
        expect(result).ok();
      });
    });

    describe('#hasTypeInfo', () => {
      it('should check if a type info is available for a node', () => {
        const result = scanner.hasTypeInfo(id);
        expect(result).to.be(true);
      });
    });

    describe('#getNode', () => {
      it('should get a node', () => {
        const result = scanner.getNode(id);
        expect(result).ok();
      });
    });

    describe('#getAliasedNode', () => {
      it('should get an aliased node', () => {
        const result = scanner.getAliasedNode(id);
        expect(result).ok();
      });
    });

    describe('#getSymbol', () => {
      it('should get the symbol by a node\'s type and the node', () => {
        const result = scanner.getSymbol(scanner.getType(id), id);
        expect(result).ok();
      });
    });

    describe('#getDeclarations', () => {
      it('should get the ambient and external declarations', () => {
        const result = scanner.getDeclarations()
        expect(result).to.be.an('array');
      });
    });

    describe('#getIdentifiers', () => {
      it('should get all identifiers of a source file', () => {
        const result = scanner.getIdentifiers(sf)
        expect(result.has('foo')).to.be(true);
        expect(result.has('bar')).to.be(true);
        expect(result.has('foobar')).to.be(false);
      });
    });

    describe('#isAllowedDeclarationSymbol', () => {
      it('should check if a symbol is an allowed ambient or external declaration', () => {
        const result = scanner.isAllowedDeclarationSymbol(scanner.getNodeSymbol(id))
        expect(result).to.be(true);
      });
    });

    describe('#hasDeclarations', () => {
      it('should check if a symbol has declarations', () => {
        const result = scanner.hasDeclarations(scanner.getNodeSymbol(id))
        expect(result).to.be(true);
      });
    });

    describe('#pathIsExternal', () => {
      it('should check if a path is external', () => {
        const result = scanner.pathIsExternal(sf.fileName)
        expect(result).to.be(false);
      });
    });

    describe('#getType', () => {
      it('should retrieve the type of a node', () => {
        const result = scanner.getType(id)
        expect(result).ok();
      });
    });

    describe('#getTypeNode', () => {
      it('should retrieve the (synthesized) type node of a node', () => {
        const result = scanner.getTypeNode(id, scanner.getType(id));
        expect(result).ok();
      });
    });

    describe('#getBaseType', () => {
      it('should retrieve the base type of a type', () => {
        const result = scanner.getBaseType(scanner.getType(id));
        expect(result).ok();
      });
    });

    describe('Type Info', () => {
      describe('#isTsrDeclaration', () => {

      });

      describe('#hasDeclarations', () => {

      });

      describe('#symbol', () => {

      });

      describe('#enclosing', () => {

      });

      describe('#sourceFile', () => {

      });

      describe('#fileName', () => {

      });

      describe('#declarations', () => {

      });

      describe('#firstDeclaration', () => {

      });

      describe('#type', () => {

      });

      describe('#typeText', () => {

      });

      describe('#typeNode', () => {

      });

      describe('#baseType', () => {

      });

      describe('#baseTypeNode', () => {

      });

      describe('#baseTypeText', () => {

      });

      describe('#isSynthesized', () => {

      });

      describe('#isReference', () => {

      });

      describe('#isLiteral', () => {

      });

      describe('#isAmbient', () => {

      });

      describe('#isDeclaration', () => {

      });

      describe('#isInDeclarationFile', () => {

      });

      describe('#isExternal', () => {

      });

      describe('#isExternalModule', () => {

      });
    });
  });
};
