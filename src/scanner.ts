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
  private _declarationsTable: Map<ts.Symbol, string[]>;

  private _incompatibleKinds = [
    ts.SyntaxKind.ImportClause
  ];

  constructor(private _program: ts.Program, defer = false) {
    this._checker = this._program.getTypeChecker();
    this._nodeMap = new Map();
    this._symbolMap = new Map();
    this._sourceFileMap = new Map();
    this._propertiesTable = new Map();
    this._declarationsTable = new Map();

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

  public getAttributes(node: ts.Node | ts.Symbol): ScanAttributes {
    if (!(node as any).kind) {
      node = this.getNodeFromSymbol(node as ts.Symbol);
    }

    return this._propertiesTable.get(node as ts.Node);
  }

  private scanner(sourceFile: ts.SourceFile) {
    const set = new Set();
    this._sourceFileMap.set(sourceFile, set);

    const scanNode = (node: ts.Node) => {
      if (!node) {
        return;
      }

      const symbol = this._checker.getSymbolAtLocation(node);

      set.add(node);
      this._nodeMap.set(node, symbol);
      this._symbolMap.set(symbol, node);

      let type: ts.Type;
      let typeNode: ts.TypeNode;
      let typeText: string;
      let baseType: ts.Type;
      let baseTypeNode: ts.TypeNode;
      let baseTypeText: string;

      if (this._incompatibleKinds.indexOf(node.kind) === -1) {
        type = this._checker.getTypeAtLocation(node);
        // type = this._checker.getApparentType(type);
      }

      if (type) {
        // if (node.kind === ts.SyntaxKind.ClassDeclaration || node.kind === ts.SyntaxKind.InterfaceDeclaration) {
        //   try {
        //     let t = type;
        //     console.log(this._checker.typeToString(t));
        //
        //     t.getProperties().forEach(prop => {
        //          console.log(prop.getName());
        //          let resolvedPropertyType = this._checker.getTypeOfSymbolAtLocation(prop, node);
        //          let resolvedTypeNode = this._checker.typeToTypeNode(resolvedPropertyType);
        //          console.log(ts.SyntaxKind[resolvedTypeNode.kind]);
        //          // let refl = this._checker
        //          // console.log((resolvedTypeNode as ts.TypeLiteralNode));
        //          console.log(this._checker.typeToString(resolvedPropertyType));
        //          console.log();
        //     });
        //
        //     // console.log(type.getApparentProperties().map(prop => {
        //     //   // this._checker.getAugmentedPropertiesOfType()
        //     //   //console.log(prop)
        //     //   // console.log(this._checker.signatureToString(this._checker.getSignatureFromDeclaration(prop.valueDeclaration as ts.SignatureDeclaration)));
        //     //   // console.log(this._checker.typeToString(this._checker.getDeclaredTypeOfSymbol(prop)));
        //     //
        //     //   return prop.getName();
        //     // }));
        //     // console.log(type.symbol.declarations.length);
        //     console.log('---------');
        //     console.log();
        //   } catch (e) { }
        // }
        typeNode = this._checker.typeToTypeNode(type, node.parent);
        typeText = this._checker.typeToString(type);
      }

      let isLiteral = util.isLiteral(node);
      let isTypeNode = util.isTypeNode(node);

      let typeIsReference = type && typeNode ? typeNode.kind === ts.SyntaxKind.TypeReference : false;
      let typeReferenceIsAmbient = false;
      let typeReferenceIsDeclaration = false;
      let typeReferenceIsInDeclarationFile = false;
      let typeReferenceIsExternal = false;
      let typeIsLiteral = !typeNode ? false : util.isLiteral(typeNode);
      let typeDeclarations: ts.Declaration[] = [];

      if (typeIsLiteral && type) {
        baseType = this._checker.getBaseTypeOfLiteralType(type);

        if (baseType) {
          baseTypeNode = this._checker.typeToTypeNode(baseType, node.parent);
          baseTypeText = this._checker.typeToString(baseType);
        }
      }

      if (typeIsReference && type && type.symbol && type.symbol.declarations) {
        const firstDeclaration = type.symbol.declarations[0];
        const sf = firstDeclaration.getSourceFile();
        typeDeclarations = type.symbol.declarations;

        typeReferenceIsAmbient = util.isAmbient(firstDeclaration);
        typeReferenceIsDeclaration = util.isDeclaration(firstDeclaration);
        typeReferenceIsInDeclarationFile = sf.isDeclarationFile;
        typeReferenceIsExternal = this.pathIsExternal(sf.fileName);
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

      let typeAttributes: ScanTypeAttributes = {
        TSR_DECLARATION,
        isReference: typeIsReference,
        declarations: typeDeclarations,
        isLiteral: typeIsLiteral,
        isAmbient: typeReferenceIsAmbient,
        isDeclaration: typeReferenceIsDeclaration,
        isInDeclarationFile: typeReferenceIsInDeclarationFile,
        isExternal: typeReferenceIsExternal,
        symbol: type ? type.symbol : void 0,
        // type: type,
        // node: typeNode,
        // text: typeText,
        // baseType: literalType,
        // baseNode: literalTypeNode,
        // baseText: literalTypeText
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

  public pathIsExternal(fileName: string): boolean {
    const rootDir = this.program.getCompilerOptions().rootDir;
    return !fileName.startsWith(rootDir);
  }

  public mapNode(node: ts.Node, other: ts.Node): void {
    this._propertiesTable.set(other, this._propertiesTable.get(node));
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
