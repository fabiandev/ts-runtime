import * as ts from 'typescript';

export interface ScanProperties {
  node: ts.Node;
  symbol: ts.Symbol;
  sourceFile: ts.SourceFile;
  isDeclaration: boolean;
  type?: ts.Type;
  typeNode?: ts.TypeNode;
  typeText?: string;
}

export class Scanner {

  private _scanned = false;
  private _checker: ts.TypeChecker;
  private _nodeMap: Map<ts.Node, ts.Symbol>;
  private _symbolMap: Map<ts.Symbol, ts.Node>;
  private _sourceFileMap: Map<ts.SourceFile, Set<ts.Node>>;
  private _propertiesTable: Map<ts.Node, ScanProperties>;

  private _incompatibleKinds = [
    ts.SyntaxKind.ImportClause
  ];

  constructor(private _program: ts.Program, defer = false) {
    this._checker = this._program.getTypeChecker();
    this._nodeMap = new Map();
    this._symbolMap = new Map();
    this._sourceFileMap = new Map();
    this._propertiesTable = new Map();

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
      // console.log(!!symbol);
      set.add(node);
      this._nodeMap.set(node, symbol);
      this._symbolMap.set(symbol, node);

      let type: ts.Type, typeNode: ts.TypeNode, typeText: string;

      console.log(ts.SyntaxKind[node.kind]);

      if (this._incompatibleKinds.indexOf(node.kind) === -1) {
        type = this._checker.getTypeAtLocation(node);
      }

      if (type) {
        typeNode = this._checker.typeToTypeNode(type);
        typeText = this._checker.typeToString(type);
      }

      let isDeclaration: undefined = void 0;

      let scanProperties: ScanProperties = {
        node, symbol, sourceFile, isDeclaration, type, typeNode, typeText
      };

      this._propertiesTable.set(node, scanProperties);

      // TODO: remove debug
      if (type) {
        console.log(this._checker.typeToString(type));
      } else {
        console.log('-');
      }
      if (symbol) {
        console.log(ts.SymbolFlags[symbol.getFlags()]);
      }
      console.log();

      ts.forEachChild(node, scanNode);
    };

    ts.forEachChild(sourceFile, scanNode);
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

}

export default Scanner;
