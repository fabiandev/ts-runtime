import * as ts from 'typescript';
import * as util from './util';

export interface TypeInfo {
  TSR_DECLARATION: boolean;
  enclosing?: ts.Node;
  sourceFile?: ts.SourceFile;
  fileName?: string;
  declarations: ts.Declaration[];
  type: ts.Type;
  typeText: string;
  typeNode: ts.TypeNode;
  baseType?: ts.Type;
  baseTypeNode?: ts.TypeNode;
  baseTypeText?: string;
  isSynthesized: boolean;
  isReference: boolean;
  isLiteral: boolean;
  isAmbient: boolean;
  isDeclaration: boolean;
  isExternal: boolean;
  isInDeclarationFile: boolean;
  symbol?: ts.Symbol;
}

export interface TsrDeclaration {
  symbol: ts.Symbol,
  names: string[]
}

export class Scanner {

  private program: ts.Program;
  private checker: ts.TypeChecker;
  private declarations: TsrDeclaration[] = [];
  private aliases: Map<ts.Node, ts.Node> = new Map();
  private properties: Map<ts.Node, TypeInfo> = new Map();
  private scanned: Set<ts.Node> = new Set();

  private skip: ts.SyntaxKind[] = [
    ts.SyntaxKind.NamedImports,
    ts.SyntaxKind.NamespaceImport,
    ts.SyntaxKind.ImportClause,
    ts.SyntaxKind.SourceFile
  ];

  private AllowedDeclarations = ts.SymbolFlags.Interface | ts.SymbolFlags.Class |
  ts.SymbolFlags.Enum | ts.SymbolFlags.EnumMember | ts.SymbolFlags.TypeAlias |
  ts.SymbolFlags.Function | ts.SymbolFlags.TypeLiteral | ts.SymbolFlags.Variable;

  constructor(program: ts.Program, defer = false) {
    this.program = program;
    this.checker = program.getTypeChecker();
    if (!defer) this.scan();
  }

  public scan(): void {
    const sourceFiles = this.program
      .getSourceFiles()
      .filter(sf => !sf.isDeclarationFile);

    for (let sourceFile of sourceFiles) {
      this.scanRecursive(sourceFile);
    }

    return;
  }

  public mapNode<T extends ts.Node>(alias: T, original: ts.Node): T {
    if (alias === original) {
      return;
    }

    this.aliases.set(alias, original);

    return alias;
  }

  public getTypeInfo(node: ts.Node): TypeInfo {
    return this.properties.get(this.getNode(node));
  }

  public hasTypeInfo(node: ts.Node): boolean {
    return this.properties.has(this.getNode(node));
  }

  public getNode(node: ts.Node): ts.Node {
    node = this.getAliasedNode(node);

    if (this.properties.has(node)) {
      return node;
    }

    this.scanNode(node);

    return this.getAliasedNode(node);
  }

  public getAliasedNode(node: ts.Node): ts.Node {
    while (this.aliases.has(node)) {
      node = this.aliases.get(node);
    }

    return node;
  }

  public getSymbol(type: ts.Type, node: ts.Node): ts.Symbol {
    let symbol = type && (type.aliasSymbol || type.symbol ||
      (ts.isQualifiedName(node) || ts.isIdentifier(node) || ts.isEntityName(node) ?
        this.checker.getSymbolAtLocation(node) : undefined));

    return symbol;
  }

  public getDeclarations(): TsrDeclaration[] {
    return this.declarations;
  }

  private scanRecursive(entry: ts.Node): void {
    const scanNode = (node: ts.Node) => {
      if (!node) return;
      this.scanNode(node);
      ts.forEachChild(node, scanNode);
    };

    ts.forEachChild(entry, scanNode);
  }

  private scanNode(node: ts.Node): TypeInfo {
    // if (this.scanned.has(node)) {
    //   return;
    // }

    // this.scanned.add(node);

    if (!this.shouldScan(node)) {
      return;
    }

    if (ts.isAsExpression(node)) {
      node = this.getAsExpression(node);
    }

    const enclosing = node;
    const type = this.getType(node);
    const symbol = this.getSymbol(type, node);
    const typeNode = this.getTypeNode(node, type);
    const typeText = this.checker.typeToString(type, enclosing);
    const isLiteral = util.isLiteral(typeNode);
    const isReference = ts.isTypeReferenceNode(typeNode);
    const isSynthesized = util.isSynthesized(typeNode);
    const baseType = isLiteral && this.getBaseType(type);
    const baseTypeNode = baseType && this.checker.typeToTypeNode(baseType, enclosing);
    const baseTypeText = baseType && this.checker.typeToString(baseType, enclosing);

    let declarations: ts.Declaration[] = [];
    let sourceFile: ts.SourceFile;
    let fileName: string;
    let isAmbient = false;
    let isDeclaration = false;
    let isInDeclarationFile = false;
    let isExternal = false;

    if (this.hasDeclarations(symbol)) {
      declarations = symbol.getDeclarations();
      const firstDeclaration = declarations[0];
      sourceFile = firstDeclaration.getSourceFile();
      fileName = sourceFile.fileName;
      isAmbient = util.isAmbient(firstDeclaration);
      isDeclaration = util.isAmbientDeclaration(firstDeclaration);
      isInDeclarationFile = sourceFile.isDeclarationFile;
      isExternal = this.pathIsExternal(fileName);
    }

    const TSR_DECLARATION =
      ((isExternal && (isAmbient || isDeclaration || isInDeclarationFile) ||
        (!isExternal && (isDeclaration || isInDeclarationFile))));

    if (TSR_DECLARATION && symbol && (symbol.flags & this.AllowedDeclarations) && (isReference || util.isPartOfTypeNode(node))) {
      this.addDeclaration(symbol, fileName);
      // if (this.defer) {
      //   for (let decl of declarations) {
      //     this.scanNode(decl)
      //   }
      // }
    }

    if (node !== typeNode) {
      util.setParent(typeNode);
      this.mapNode(typeNode, node);
    }

    const typeInfo: TypeInfo = {
      TSR_DECLARATION, enclosing, sourceFile, fileName,
      declarations, type, typeText, typeNode, baseType, baseTypeNode,
      baseTypeText, isSynthesized, isReference, isLiteral, isAmbient,
      isDeclaration, isExternal, isInDeclarationFile, symbol,
    };

    this.properties.set(node, typeInfo);

    return typeInfo;
  }

  private shouldScan(node: ts.Node): boolean {
    if (!node) {
      return false;
    }

    if (this.skip.indexOf(node.kind) !== -1) {
      return false;
    }

    return true;
  }

  private hasDeclarations(symbol: ts.Symbol): boolean {
    return symbol && symbol.declarations && symbol.declarations.length > 0;
  }

  private pathIsExternal(fileName: string): boolean {
    const rootDir = this.program.getCompilerOptions().rootDir;
    return !fileName.startsWith(rootDir);
  }

  private getAsExpression(node: ts.AsExpression): ts.Node {
    let expression = node.expression;
    this.mapNode(node, expression);
    return expression;
  }

  private getType(node: ts.Node): ts.Type {
    const isTypeNode = ts.isTypeNode(node)

    if (isTypeNode) {
      return this.checker.getTypeFromTypeNode(node as ts.TypeNode);
    }

    if ((node as any).type) {
      return this.checker.getTypeFromTypeNode((node as any).type as ts.TypeNode);
    }

    return this.checker.getTypeAtLocation(node);
  }

  private getTypeNode(node: ts.Node, type: ts.Type, enclosing?: ts.Node): ts.TypeNode {
    const isTypeNode = ts.isTypeNode(node);

    if (isTypeNode) {
      return node as ts.TypeNode;
    }

    if ((node as any).type && ts.isTypeNode((node as any).type)) {
      return (node as any).type as ts.TypeNode;
    }

    return this.checker.typeToTypeNode(type, enclosing || node);
  }

  private getBaseType(type: ts.Type): ts.Type {
    return this.checker.getBaseTypeOfLiteralType(type);
  }

  private addDeclaration(symbol: ts.Symbol, fileName: string) {
    const name = this.checker.getFullyQualifiedName(symbol);
    const uid = util.getHashedDeclarationName(name, fileName);

    const decl = this.declarations.find(decl => decl.symbol === symbol);

    if (!decl) {
      this.declarations.unshift({ symbol, names: [uid] });
      return;
    }

    if (decl.names.indexOf(uid) === -1) {
      decl.names.push(uid);
    }
  }

}
