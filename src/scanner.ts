import * as ts from 'typescript';
import * as util from './util';

export interface ScanProperties {
  node: ts.Node;                                // AST node
  symbol?: ts.Symbol;                           // node symbol
  sourceFile: ts.SourceFile;                    // node source file
  isLiteral: boolean;                           // node is a literal
  isTypeNode: boolean;                          // node is type node
  typeIsReference: boolean;                     // inferred type is a type reference
  typeReferenceIsAmbient: boolean;              // inferred type reference is declaration, interface, type alias or module/namespace
  typeReferenceIsAmbientDeclaration: boolean;   // inferred type reference declaration has declare keyword
  typeReferenceIsExternal: boolean;             // inferred type reference is external
  typeReferenceDeclarationCount: number;        // inferred type reference declaration count (e.g. for declaration merging)
  typeIsLiteral: boolean;                       // inferred type is a literal type
  type?: ts.Type;                               // inferred type
  typeNode?: ts.TypeNode;                       // inferred type node
  typeText?: string;                            // inferred type text
  literalType?: ts.Type;                        // inferred base type of literal type
  literalTypeNode?: ts.TypeNode;                // inferred base type node of literal type
  literalTypeText?: string;                     // inferred base type text of literal type
}

export class Scanner {

  private _scanned = false;
  private _checker: ts.TypeChecker;
  private _nodeMap: Map<ts.Node, ts.Symbol>;
  private _symbolMap: Map<ts.Symbol, ts.Node>;
  private _sourceFileMap: Map<ts.SourceFile, Set<ts.Node>>;
  private _propertiesTable: Map<ts.Node, ScanProperties>;
  private _externalReferences: Set<ts.Node>;
  private _ambientDeclarations: Set<ts.Node>;

  private _incompatibleKinds = [
    ts.SyntaxKind.ImportClause
  ];

  constructor(private _program: ts.Program, defer = false) {
    this._checker = this._program.getTypeChecker();
    this._nodeMap = new Map();
    this._symbolMap = new Map();
    this._sourceFileMap = new Map();
    this._propertiesTable = new Map();
    this._externalReferences = new Set();

    if (!defer) {
      this.scan();
    }
  }

  public scan(): void {
    const sourceFiles = this._program.getSourceFiles().filter(sf => !sf.isDeclarationFile);

    for (let sourceFile of sourceFiles) {
      this.scanner(sourceFile);
    }

    this._scanned = true;
  }

  public getSymbolFromNode(node: ts.Node): ts.Symbol {
    return this._nodeMap.get(node);
  }

  public getNodeFromSymbol(symbol: ts.Symbol): ts.Node {
    return this._symbolMap.get(symbol);
  }

  public getPropertiesFromNode(node: ts.Node): ScanProperties {
    return this._propertiesTable.get(node);
  }

  public getPropertiesFromSymbol(symbol: ts.Symbol): ScanProperties {
    const node = this.getNodeFromSymbol(symbol);

    if (!node) {
      return void 0;
    }

    return this.getPropertiesFromNode(node);
  }

  private scanner(sourceFile: ts.SourceFile) {
    const set = new Set();
    this._sourceFileMap.set(sourceFile, set);

    const scanNode = (node: ts.Node) => {
      if (!node) {
        ts.forEachChild(node, scanNode);
        return;
      }

      const symbol = this._checker.getSymbolAtLocation(node);

      set.add(node);
      this._nodeMap.set(node, symbol);
      this._symbolMap.set(symbol, node);

      let type: ts.Type;
      let typeNode: ts.TypeNode;
      let typeText: string;
      let literalType: ts.Type;
      let literalTypeNode: ts.TypeNode;
      let literalTypeText: string;

      if (this._incompatibleKinds.indexOf(node.kind) === -1) {
        type = this._checker.getTypeAtLocation(node);
      }

      if (type) {
        typeNode = this._checker.typeToTypeNode(type, node.parent);
        typeText = this._checker.typeToString(type);
      }

      let isLiteral = util.isLiteral(node);
      let isTypeNode = util.isTypeNode(node);
      let typeIsReference = type && typeNode ? typeNode.kind === ts.SyntaxKind.TypeReference : false;
      let typeReferenceIsAmbient: boolean;
      let typeReferenceIsAmbientDeclaration: boolean;
      let typeReferenceIsExternal: boolean;
      let typeReferenceDeclarationCount: number;
      let typeIsLiteral = !typeNode ? false : util.isLiteral(typeNode);

      if (typeIsReference) {
        if (type.symbol && type.symbol.declarations) {
          typeReferenceDeclarationCount = type.symbol.declarations.length;

          type.symbol.declarations.forEach(declaration => {
            const sf = declaration.getSourceFile();
            const isAmbient = util.isAmbient(declaration);
            const isAmbientDeclaration = util.isAmbientDeclaration(declaration);
            const isExternal = this.pathIsExternal(sf.fileName);

            typeReferenceIsAmbient = !typeReferenceIsAmbient ? isAmbient : typeReferenceIsAmbient;
            typeReferenceIsExternal = !typeReferenceIsExternal ? isExternal : typeReferenceIsExternal;
            typeReferenceIsAmbientDeclaration = !typeReferenceIsAmbientDeclaration ? sf.isDeclarationFile || isAmbientDeclaration : typeReferenceIsAmbientDeclaration;
          });
        }
      }

      if (typeIsReference && typeReferenceIsAmbient && typeReferenceIsExternal) {
        this.externalReferences.add(node);
      }

      if (typeIsLiteral && type) {
        literalType = this._checker.getBaseTypeOfLiteralType(type);

        if (literalType) {
          literalTypeNode = this._checker.typeToTypeNode(literalType, node.parent);
          literalTypeText = this._checker.typeToString(literalType);
        }
      }

      let scanProperties: ScanProperties = {
        node, symbol, sourceFile, isLiteral, isTypeNode, typeIsReference,
        typeReferenceIsAmbient, typeReferenceIsAmbientDeclaration, typeReferenceIsExternal,
        typeReferenceDeclarationCount, typeIsLiteral, type, typeNode, typeText,
        literalType, literalTypeNode, literalTypeText
      };

      this._propertiesTable.set(node, scanProperties);

      ts.forEachChild(node, scanNode);
    };

    ts.forEachChild(sourceFile, scanNode);
  }

  public pathIsExternal(fileName: string): boolean {
    const rootDir = this.program.getCompilerOptions().rootDir;
    return !fileName.startsWith(rootDir);
  }

  get program(): ts.Program {
    return this._program;
  }

  get scanned(): boolean {
    return this._scanned;
  }

  get checker(): ts.TypeChecker {
    return this._checker;
  }

  get nodeMap(): Map<ts.Node, ts.Symbol> {
    return this._nodeMap;
  }

  get symbolMap(): Map<ts.Symbol, ts.Node> {
    return this._symbolMap;
  }

  get sourceFileMap(): Map<ts.SourceFile, Set<ts.Node>> {
    return this._sourceFileMap;
  }

  get propertiesTable(): Map<ts.Node, ScanProperties> {
    return this._propertiesTable;
  }

  get incompatibeKinds(): ts.SyntaxKind[] {
    return this._incompatibleKinds;
  }

  get externalReferences(): Set<ts.Node> {
    return this._externalReferences;
  }

}

export default Scanner;
