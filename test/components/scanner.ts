import * as ts from 'typescript';
import { Scanner, TypeInfo } from '../../src/scanner';
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
      it('should scan all source files', () => {
        scanner.scan();
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
      let info: TypeInfo;

      beforeEach(() => {
        info = scanner.getTypeInfo(id);
      });

      describe('#isTsrDeclaration', () => {
        it('should check if it is a TSR declaration', () => {
          const result = info.isTsrDeclaration();
          expect(result).to.be(false);
        });
      });

      describe('#hasDeclarations', () => {
        it('should check if it has declarations', () => {
          const result = info.hasDeclarations();
          expect(result).to.be(true);
        });
      });

      describe('#symbol', () => {
        it('should retrieve the symbol', () => {
          const result = info.symbol;
          expect(result).ok();
        });
      });

      describe('#enclosing', () => {
        it('should retrieve the enclosing node', () => {
          const result = info.enclosing;
          expect(result).ok();
        });
      });

      describe('#sourceFile', () => {
        it('should retrieve the source file', () => {
          const result = info.sourceFile;
          expect(ts.isSourceFile(result)).to.be(true);
        });
      });

      describe('#fileName', () => {
        it('should retrieve the source file name', () => {
          const result = info.fileName;
          expect(result).to.be.a('string');
        });
      });

      describe('#declarations', () => {
        it('should retrieve all declarations', () => {
          const result = info.declarations;
          expect(result).to.be.an('array');
        });
      });

      describe('#firstDeclaration', () => {
        it('should retrieve the first declaration', () => {
          const result = info.firstDeclaration;
          expect(result).ok();
        });
      });

      describe('#type', () => {
        it('should retrieve the type', () => {
          const result = info.type;
          expect(result).ok();
        });
      });

      describe('#typeText', () => {
        it('should retrieve the type text', () => {
          const result = info.typeText;
          expect(result).to.be.a('string');
        });
      });

      describe('#typeNode', () => {
        it('should retrieve the type node', () => {
          const result = info.typeNode;
          expect(result).ok();
        });
      });

      describe('#baseType', () => {
        it('should retrieve the base tyoe', () => {
          const result = info.baseType;
          expect(result).to.be(undefined);
        });
      });

      describe('#baseTypeNode', () => {
        it('should retrieve the base type node', () => {
          const result = info.baseTypeNode;
          expect(result).to.be(undefined);
        });
      });

      describe('#baseTypeText', () => {
        it('should retrieve the base type text', () => {
          const result = info.baseTypeText;
          expect(result).to.be(undefined);
        });
      });

      describe('#isSynthesized', () => {
        it('should check if it is synthesized', () => {
          const result = info.isSynthesized;
          expect(result).to.be(true);
        });
      });

      describe('#isReference', () => {
        it('should check if it is a reference', () => {
          const result = info.isReference;
          expect(result).to.be(false);
        });
      });

      describe('#isLiteral', () => {
        it('should check if it is a literal', () => {
          const result = info.isLiteral;
          expect(result).to.be(false);
        });
      });

      describe('#isAmbient', () => {
        it('should check if it is ambient', () => {
          const result = info.isAmbient;
          expect(result).to.be(false);
        });
      });

      describe('#isDeclaration', () => {
        it('should check if it is an ambient declaration', () => {
          const result = info.isDeclaration;
          expect(result).to.be(false);
        });
      });

      describe('#isInDeclarationFile', () => {
        it('should check if it is in a declaration file', () => {
          const result = info.isInDeclarationFile;
          expect(result).to.be(false);
        });
      });

      describe('#isExternal', () => {
        it('should check if it is external', () => {
          const result = info.isExternal;
          expect(result).to.be(false);
        });
      });

      describe('#isExternalModule', () => {
        it('should check if it is an external module', () => {
          const result = info.isExternalModule;
          expect(result).to.be(false);
        });
      });
    });
  });
};
