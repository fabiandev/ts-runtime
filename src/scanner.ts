import * as ts from 'typescript';
import * as util from './util';
import { ProgramState } from './transform';

export interface TypeInfo {
  TSR_DECLARATION: boolean;
  isReference: boolean;
  declarations: ts.Declaration[];
  isLiteral: boolean;
  isExternal: boolean;
  isAmbient: boolean;
  isDeclaration: boolean;
  isInDeclarationFile: boolean;
  symbol: ts.Symbol;
}

export interface NodeInfo {
  node: ts.Node;
  symbol?: ts.Symbol;
  sourceFile: ts.SourceFile;
  isLiteral: boolean;
  isTypeNode: boolean;
  typeInfo?: TypeInfo;
  type: ts.Type;
  typeNode: ts.TypeNode;
  typeText: string;
  baseType: ts.Type;
  baseTypeNode: ts.TypeNode;
  baseTypeText: string;
}

export class Scanner {

  private _state: ProgramState;
  private _checker: ts.TypeChecker;
  private _propertiesTable: Map<ts.Node, NodeInfo>;
  private _aliasMap: Map<ts.Node, ts.Node>;
  private _declarationsTable: Map<ts.Symbol, string[]>;

  private _incompatibleKinds = [
    ts.SyntaxKind.ImportClause,
    ts.SyntaxKind.SourceFile
  ];

  constructor(private _program: ts.Program, state = ProgramState.None, defer = true, scanDeclarationFiles = false) {
    this._state = state;
    this._checker = this._program.getTypeChecker();

    this._propertiesTable = new Map();
    this._aliasMap = new Map();
    this._declarationsTable = new Map();

    if (!defer) {
      this.scan(scanDeclarationFiles)
    }
  }

  public scan(scanDeclarationFiles = false): void {
    let sourceFiles = this._program.getSourceFiles();

    if (!scanDeclarationFiles) {
      sourceFiles = sourceFiles.filter(sf => !sf.isDeclarationFile);
    }

    for (let sourceFile of sourceFiles) {
      this.scanner(sourceFile);
    }
  }

  public getSymbolFromNode(node: ts.Node): ts.Symbol {
    const attributes = this._propertiesTable.get(this.getNode(node));
    return attributes ? attributes.symbol : null;
  }

  public getInfo(node: ts.Node): NodeInfo {
    return this._propertiesTable.get(this.getNode(node));
  }

  private getNode(node: ts.Node): ts.Node {
    if (this.propertiesTable.has(node)) {
      return node;
    }

    if (this.aliasMap.has(node)) {
      return this.aliasMap.get(node);
    }

    this.scanNode(node);

    return node;
  }

  private scanner(sourceFile: ts.SourceFile) {
    const scanNode = (node: ts.Node) => {
      if (!node) return;
      this.scanNode(node);
      ts.forEachChild(node, scanNode);
    };

    ts.forEachChild(sourceFile, scanNode);
  }

  private scanNode(node: ts.Node) {
    if (!node || this._incompatibleKinds.indexOf(node.kind) !== -1) {
      return;
    }

    let type: ts.Type;
    let typeNode: ts.TypeNode;
    let typeText: string;
    let baseType: ts.Type;
    let baseTypeNode: ts.TypeNode;
    let baseTypeText: string;

    let isTypeNode = util.isTypeNode(node);
    let isLiteral = util.isLiteral(node);
    let sourceFile = node.getSourceFile();

    if (isTypeNode) {
      type = this._checker.getTypeFromTypeNode(node as ts.TypeNode);
    } else if ((node as any).type) {
      type = this._checker.getTypeFromTypeNode((node as any).type as ts.TypeNode);
    } else {
      type = this._checker.getTypeAtLocation(node);
    }

    if (!type) {
      return;
    }

    let symbol = this._checker.getSymbolAtLocation(node);
    let typeSymbol = type.aliasSymbol || type.symbol || symbol;

    typeNode = isTypeNode ? node as ts.TypeNode : this._checker.typeToTypeNode(type, node.parent);
    typeText = this._checker.typeToString(type, node.parent);

    let typeIsReference = typeNode ? typeNode.kind === ts.SyntaxKind.TypeReference : false;
    let typeReferenceIsAmbient = false;
    let typeReferenceIsDeclaration = false;
    let typeReferenceIsInDeclarationFile = false;
    let typeReferenceIsExternal = false;
    let typeIsLiteral = !typeNode ? false : util.isLiteral(typeNode);
    let typeDeclarations: ts.Declaration[] = [];

    if (typeIsLiteral) {
      baseType = this._checker.getBaseTypeOfLiteralType(type);

      if (baseType) {
        baseTypeNode = this._checker.typeToTypeNode(baseType, node.parent);
        baseTypeText = this._checker.typeToString(baseType, node.parent);
      }
    }

    if (typeIsReference && typeSymbol && typeSymbol.declarations) {
      for (let dec of typeSymbol.declarations) {
        const sf = dec.getSourceFile();
        typeReferenceIsAmbient = !typeReferenceIsAmbient ? util.isAmbient(dec) : typeReferenceIsAmbient;
        typeReferenceIsDeclaration = !typeReferenceIsDeclaration ? util.isDeclaration(dec) : typeReferenceIsDeclaration;
        typeReferenceIsInDeclarationFile = !typeReferenceIsInDeclarationFile ? sf.isDeclarationFile : typeReferenceIsInDeclarationFile;
        typeReferenceIsExternal = !typeReferenceIsExternal ? this.pathIsExternal(sf.fileName) : typeReferenceIsExternal;
      }
    }

    const TSR_DECLARATION = typeIsReference && isTypeNode && node.kind !== ts.SyntaxKind.TypeParameter && typeNode.kind !== ts.SyntaxKind.TypeParameter &&
      ((typeReferenceIsExternal && (typeReferenceIsAmbient || typeReferenceIsDeclaration || typeReferenceIsInDeclarationFile)) ||
        (!typeReferenceIsExternal && (typeReferenceIsDeclaration || typeReferenceIsInDeclarationFile)));

    let typeInfo: TypeInfo = {
      TSR_DECLARATION,
      isReference: typeIsReference,
      declarations: typeDeclarations,
      isLiteral: typeIsLiteral,
      isAmbient: typeReferenceIsAmbient,
      isDeclaration: typeReferenceIsDeclaration,
      isInDeclarationFile: typeReferenceIsInDeclarationFile,
      isExternal: typeReferenceIsExternal,
      symbol: type.aliasSymbol || type.symbol,
    };

    let nodeInfo: NodeInfo = {
      node, symbol, sourceFile, isLiteral, isTypeNode, typeInfo, type,
      typeNode, typeText, baseType, baseTypeNode, baseTypeText
    };

    this._propertiesTable.set(node, nodeInfo);

    if (TSR_DECLARATION && isTypeNode && this._state !== ProgramState.FirstPass && typeInfo.symbol) {
      let sf = typeInfo.symbol.declarations[0].getSourceFile().fileName;
      let hash = util.getHash(sf);
      let name = this.checker.getFullyQualifiedName(typeInfo.symbol);
      name = name || (typeNode as ts.TypeReferenceNode).typeName.getText();
      name = `${name}.${hash}`;

      if (!this._declarationsTable.has(typeInfo.symbol)) {
        this._declarationsTable.set(typeInfo.symbol, [name])
      } else {
        const names = this._declarationsTable.get(typeInfo.symbol);

        if (names.indexOf(name) === -1) {
          names.push(name);
        }
      }
    }

    return nodeInfo;
  }

  public getDeclarations(): Map<ts.Symbol, string[]> {
    return this._declarationsTable;
  }

  public pathIsExternal(fileName: string): boolean {
    const rootDir = this.program.getCompilerOptions().rootDir;
    return !fileName.startsWith(rootDir);
  }

  public mapNode(original: ts.Node, other: ts.Node): void {
    this._aliasMap.set(other, original);
  }

  get program(): ts.Program {
    return this._program;
  }

  get checker(): ts.TypeChecker {
    return this._checker;
  }

  get propertiesTable(): Map<ts.Node, NodeInfo> {
    return this._propertiesTable;
  }

  get aliasMap(): Map<ts.Node, ts.Node> {
    return this._aliasMap;
  }

  get incompatibeKinds(): ts.SyntaxKind[] {
    return this._incompatibleKinds;
  }

  get declarationTable(): Map<ts.Symbol, string[]> {
    return this._declarationsTable;
  }

}

export default Scanner;
