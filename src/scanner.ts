import * as ts from 'typescript';
import * as util from './util';

export interface ScanTypeAttributes {
  TSR_DECLARATION: boolean;
  isReference: boolean;
  declarations: ts.Declaration[];
  isLiteral: boolean;
  isExternal: boolean;
  isAmbient: boolean;
  isDeclaration: boolean;
  isInDeclarationFile: boolean;
  symbol: ts.Symbol;
  // type: ts.Type;
  // node: ts.TypeNode;
  // text: string;
  // baseType: ts.Type;
  // baseNode: ts.TypeNode;
  // baseText: string;
}

export interface ScanAttributes {
  node: ts.Node;
  symbol?: ts.Symbol;
  sourceFile: ts.SourceFile;
  isLiteral: boolean;
  isTypeNode: boolean;
  typeAttributes?: ScanTypeAttributes;
  type: ts.Type;
  typeNode: ts.TypeNode;
  typeText: string;
  baseType: ts.Type;
  baseTypeNode: ts.TypeNode;
  baseTypeText: string;
}

export class Scanner {

  private _scanned = false;
  private _checker: ts.TypeChecker;
  private _nodeMap: Map<ts.Node, ts.Symbol>;
  private _symbolMap: Map<ts.Symbol, ts.Node>;
  private _sourceFileMap: Map<ts.SourceFile, Set<ts.Node>>;
  private _propertiesTable: Map<ts.Node, ScanAttributes>;
  private _aliasMap: Map<ts.Node, ts.Node>;
  private _declarationsTable: Map<ts.Symbol, string[]>;
  private _noAssert: Set<ts.Node>;

  private _incompatibleKinds = [
    ts.SyntaxKind.ImportClause
  ];

  constructor(private _program: ts.Program, defer = false) {
    this._checker = this._program.getTypeChecker();
    this._nodeMap = new Map();
    this._symbolMap = new Map();
    this._sourceFileMap = new Map();
    this._propertiesTable = new Map();
    this._aliasMap = new Map();
    this._declarationsTable = new Map();
    this._noAssert = new Set();

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

  public shouldAssert(node: ts.Node): boolean {
    return !this._noAssert.has(node);
  }

  public getAttributes(node: ts.Node | ts.Symbol): ScanAttributes {
    if (!node) {
      return null;
    }

    if (!(node as any).kind) {
      node = this.getNodeFromSymbol(node as ts.Symbol);
    }

    let found = this._propertiesTable.get(node as ts.Node);

    if (!found) {
      return this._propertiesTable.get(this._aliasMap.get(node as ts.Node))
    }

    return found;
  }

  private scanner(sourceFile: ts.SourceFile) {
    const set = new Set();
    this._sourceFileMap.set(sourceFile, set);

    const scanNode = (node: ts.Node) => {
      if (!node) {
        return;
      }

      if (this._incompatibleKinds.indexOf(node.kind) !== -1) {
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

      // if (node.kind === ts.SyntaxKind.AsExpression) {
      //   this.mapNode((node as ts.AsExpression).expression, node);
      //   node = (node as ts.AsExpression).expression;
      // }

      if ((node as any).type) {
        type = this._checker.getTypeFromTypeNode((node as any).type as ts.TypeNode);
      } else if (isTypeNode) {
        type = this._checker.getTypeFromTypeNode(node as ts.TypeNode);
      } else {
        type = this._checker.getTypeAtLocation(node);
      }

      if (!type) {
        return;
      }

      // let fillType: ts.TypeNode;
      // if (!(node as any).type) {
      //   switch (node.kind) {
      //     case ts.SyntaxKind.Parameter:
      //     case ts.SyntaxKind.PropertySignature:
      //     case ts.SyntaxKind.PropertyDeclaration:
      //     case ts.SyntaxKind.MethodSignature:
      //     case ts.SyntaxKind.CallSignature:
      //     case ts.SyntaxKind.ConstructSignature:
      //     case ts.SyntaxKind.IndexSignature:
      //       fillType = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
      //       break;
      //     case ts.SyntaxKind.VariableDeclaration:
      //       if (util.declarationCanHaveTypeAnnotation(node)) {
      //         fillType = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
      //       }
      //       break;
      //     case ts.SyntaxKind.MethodDeclaration:
      //     // case ts.SyntaxKind.Constructor:
      //     case ts.SyntaxKind.GetAccessor:
      //     // case ts.SyntaxKind.SetAccessor:
      //     case ts.SyntaxKind.FunctionExpression:
      //     case ts.SyntaxKind.ArrowFunction:
      //     case ts.SyntaxKind.FunctionDeclaration:
      //       fillType = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
      //       // type = type && ((type as any).type || type);
      //       break;
      //   }
      //
      //   if (fillType) {
      //     (node as any).type = fillType;
      //     util.setParent(node);
      //   }
      // }

      let symbol = this._checker.getSymbolAtLocation(node);
      let typeSymbol = symbol || type.symbol || type.aliasSymbol;

      set.add(node);
      this._nodeMap.set(node, symbol);
      this._symbolMap.set(symbol, node);

      typeNode = isTypeNode ? node as ts.TypeNode : this._checker.typeToTypeNode(type, node.parent);
      typeText = this._checker.typeToString(type, node.parent);

      // if ((typeNode && typeNode.kind === ts.SyntaxKind.AnyKeyword) || (fillType && fillType.kind === ts.SyntaxKind.AnyKeyword)) {
      //   this._noAssert.add(node);
      // }

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

      if (typeReferenceIsInDeclarationFile) {

      }

      // if (typeIsReference && typeReferenceIsAmbient && typeReferenceIsExternal) {
      //   this.externalReferences.add(node);
      // }

      const TSR_DECLARATION = typeIsReference &&
        ((typeReferenceIsExternal && (typeReferenceIsAmbient || typeReferenceIsDeclaration || typeReferenceIsInDeclarationFile)) ||
          (!typeReferenceIsExternal && (typeReferenceIsDeclaration || typeReferenceIsInDeclarationFile)));

      // if (TSR_DECLARATION) {
      //   if (!this._declarationsTable.has(type.symbol)) {
      //     this._declarationsTable.set(type.symbol, [])
      //   }
      // }

      // if (typeText === 'ts.AccessorDeclaration') {
      //   console.log('isRef', typeIsReference);
      //   console.log('refIsExt', typeReferenceIsExternal);
      //   console.log('refIsAmb', typeReferenceIsAmbient);
      //   console.log('refIsDec', typeReferenceIsDeclaration);
      //   console.log('refIsInDts', typeReferenceIsInDeclarationFile);
      //   console.log();
      // }

      let typeAttributes: ScanTypeAttributes = {
        TSR_DECLARATION,
        isReference: typeIsReference,
        declarations: typeDeclarations,
        isLiteral: typeIsLiteral,
        isAmbient: typeReferenceIsAmbient,
        isDeclaration: typeReferenceIsDeclaration,
        isInDeclarationFile: typeReferenceIsInDeclarationFile,
        isExternal: typeReferenceIsExternal,
        symbol: type.symbol || type.aliasSymbol,
      };

      let scanProperties: ScanAttributes = {
        node, symbol, sourceFile, isLiteral, isTypeNode, typeAttributes, type,
        typeNode, typeText, baseType, baseTypeNode, baseTypeText
      };

      this._propertiesTable.set(node, scanProperties);

      ts.forEachChild(node, scanNode);
    };

    ts.forEachChild(sourceFile, scanNode);
  }

  public getDeclarations(): ts.Statement[] {
    return [];
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

  get propertiesTable(): Map<ts.Node, ScanAttributes> {
    return this._propertiesTable;
  }

  get incompatibeKinds(): ts.SyntaxKind[] {
    return this._incompatibleKinds;
  }

  // get declarationsTable(): Map<ts.Node, string[]> {
  //   return this._declarationsTable;
  // }

}

export default Scanner;
