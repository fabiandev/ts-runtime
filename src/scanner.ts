import * as path from 'path';
import * as ts from 'typescript';
import * as util from './util';
import { Options } from './options';

export interface TsrDeclaration {
  symbol: ts.Symbol;
  name: string;
  originalName: string;
}

export class Scanner {
  private _options: Options;
  private _program: ts.Program;
  private _checker: ts.TypeChecker;

  private declarations: TsrDeclaration[] = [];
  private aliases: Map<ts.Node, ts.Node> = new Map();
  private properties: Map<ts.Node, TypeInfo> = new Map();
  private scanned: Set<ts.Node> = new Set();
  private identifiers: Map<ts.SourceFile, Set<string>> = new Map();
  private symbols: Map<ts.Node, ts.Symbol> = new Map();

  // private skip: ts.SyntaxKind[] = [
  //   ts.SyntaxKind.NamedImports,
  //   ts.SyntaxKind.NamespaceImport,
  //   ts.SyntaxKind.ImportClause,
  //   ts.SyntaxKind.SourceFile,
  //   ts.SyntaxKind.EndOfFileToken,
  //   ts.SyntaxKind.ObjectBindingPattern,
  //   ts.SyntaxKind.ArrayBindingPattern,
  //   ts.SyntaxKind.VariableDeclaration,
  // ];

  private scanNodes: ts.SyntaxKind[] = [
    ts.SyntaxKind.Identifier,
    ts.SyntaxKind.QualifiedName,
    ts.SyntaxKind.ExpressionWithTypeArguments,
    ts.SyntaxKind.ComputedPropertyName,
    ts.SyntaxKind.TypeReference,
    ts.SyntaxKind.MethodSignature,
    ts.SyntaxKind.MethodDeclaration,
    ts.SyntaxKind.CallSignature,
    ts.SyntaxKind.CallExpression,
    ts.SyntaxKind.FunctionDeclaration,
    ts.SyntaxKind.FunctionExpression,
    ts.SyntaxKind.ArrowFunction,
    ts.SyntaxKind.Constructor,
    ts.SyntaxKind.GetAccessor,
    ts.SyntaxKind.SetAccessor,
    ts.SyntaxKind.Parameter,
    ts.SyntaxKind.PropertySignature,
    ts.SyntaxKind.PropertyDeclaration,
    ts.SyntaxKind.ConstructSignature,
    ts.SyntaxKind.TypeAliasDeclaration,
  ];

  private AllowedDeclarations = ts.SymbolFlags.Interface | ts.SymbolFlags.Class |
  ts.SymbolFlags.RegularEnum | ts.SymbolFlags.ConstEnum | ts.SymbolFlags.Enum |
  ts.SymbolFlags.EnumMember | ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Function |
    /* ts.SymbolFlags.TypeLiteral | */ ts.SymbolFlags.Variable;

  private DisallowedDeclaratins = /*ts.SymbolFlags.TypeParameter | ts.SymbolFlags.TypeLiteral | ts.SymbolFlags.Module*/ ts.SymbolFlags.None;

  constructor(program: ts.Program, options: Options) {
    this._options = options;
    this._program = program;
    this._checker = program.getTypeChecker();
    this.scan();
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

  public getNodeSymbol(node: ts.Node): ts.Symbol {
    return this.symbols.get(this.getNode(node));
  }

  public hasNodeSymbol(node: ts.Node): boolean {
    return this.symbols.has(this.getNode(node));
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
    let symbol: ts.Symbol;

    if (type) {
      symbol = type.aliasSymbol || type.symbol;
    }

    if (!symbol && node) {
      symbol = this.checker.getSymbolAtLocation(node);
    }

    return symbol;
  }

  /**
   * Take a look at src/transform.ts to see, how to obtain all ambient and external declarations recursively
   */
  public getDeclarations(): TsrDeclaration[] {
    return this.declarations;
  }

  public getIdentifiers(sf: ts.SourceFile): Set<string> {
    return this.identifiers.get(this.getAliasedNode(sf) as ts.SourceFile);
  }

  public isAllowedDeclarationSymbol(symbol: ts.Symbol) {
    return symbol && symbol.flags && ((symbol.flags & this.AllowedDeclarations) && !(symbol.flags & this.DisallowedDeclaratins));
  }

  public hasDeclarations(symbol: ts.Symbol): boolean {
    return symbol && symbol.declarations && symbol.declarations.length > 0;
  }

  public pathIsExternal(fileName: string): boolean {
    const r = this.program.getCompilerOptions().rootDir;
    const rootDir = !r ? '' : r + path.sep;
    return !fileName.startsWith(rootDir);
  }

  public getType(node: ts.Node): ts.Type {
    const isTypeNode = ts.isTypeNode(node)

    if (isTypeNode) {
      return this.checker.getTypeFromTypeNode(node as ts.TypeNode);
    }

    if ((node as any).type) {
      return this.checker.getTypeFromTypeNode((node as any).type as ts.TypeNode);
    }

    return this.checker.getTypeAtLocation(node);
  }

  public getTypeNode(node: ts.Node, type: ts.Type, enclosing?: ts.Node): ts.TypeNode {
    const isTypeNode = ts.isTypeNode(node);

    if (isTypeNode) {
      return node as ts.TypeNode;
    }

    if ((node as any).type && ts.isTypeNode((node as any).type)) {
      return (node as any).type as ts.TypeNode;
    }

    return this.checker.typeToTypeNode(type, enclosing);
  }

  public getBaseType(type: ts.Type): ts.Type {
    return this.checker.getBaseTypeOfLiteralType(type);
  }

  private scanRecursive(entry: ts.Node): void {
    const scanNode = (node: ts.Node) => {
      this.scanNode(node);
      ts.forEachChild(node, scanNode);
    };

    ts.forEachChild(entry, scanNode);
  }

  private scanNode(node: ts.Node): ts.Node {
    if (ts.isIdentifier(node)) {
      const sf = node.getSourceFile();

      if (!this.identifiers.has(sf)) {
        this.identifiers.set(sf, new Set());
      }

      this.identifiers.get(sf).add(node.text);
    }

    // let nodeSymbol = this.checker.getSymbolAtLocation(
    //   (node as any).name || (node as any).typeName ||
    //   (node as any).exprName || (node as any).tagName
    // );
    //

    let nodeSymbol = this.checker.getSymbolAtLocation((node as any).name || node);

    if (nodeSymbol) {
      this.symbols.set(node, nodeSymbol);
    }

    if (!this.shouldScan(node)) {
      ts.forEachChild(node, n => this.scanNode(n));
      return;
    }

    node = this.getMappedNode(node);
    const typeInfo = new TypeInfo(this, node);

    if (typeInfo.isTsrDeclaration()) {
      this.addDeclaration(typeInfo.symbol, typeInfo.fileNames[0]);
    }

    if (node !== typeInfo.typeNode) {
      util.setParent(typeInfo.typeNode);
      this.mapNode(typeInfo.typeNode, node);
    }

    this.properties.set(node, typeInfo);

    return node;
  }

  private shouldScan(node: ts.Node): boolean {
    if (!node) {
      return false;
    }

    // if (this.skip.indexOf(node.kind) !== -1) {
    //   return false;
    // }

    if (this.scanNodes.indexOf(node.kind) === -1) {
      return false;
    }

    if (this.scanned.has(node)) {
      return false;
    }

    this.scanned.add(node);

    return true;
  }

  private getMappedNode(node: ts.Node): ts.Node {
    if (ts.isAsExpression(node)) {
      return this.getAsExpression(node);
    }

    node = this.getNameExpression(node);

    return node;
  }

  private getNameExpression(node: ts.Node): ts.Node {
    let expr = node;

    if ((node as any).typeName) {
      expr = (node as any).typeName;
    }

    // if ((node as any).exprName) {
    //   expr = (node as any).exprName;
    // }

    // if ((node as any).parameterName) {
    //   expr = (node as any).parameterName;
    // }

    // if ((node as any).name) {
    //   expr = (node as any).name;
    // }
    //
    // if ((node as any).tagName) {
    //   expr = (node as any).tagName;
    // }

    if (expr !== node) {
      this.mapNode(node, expr);
    }

    return expr;
  }

  private getAsExpression(node: ts.AsExpression): ts.Node {
    let expression = node.expression;
    this.mapNode(node, expression);
    return expression;
  }

  private addDeclaration(symbol: ts.Symbol, fileName: string) {
    if (!symbol) return;

    const name = this.checker.getFullyQualifiedName(symbol);
    const uid = util.getHashedDeclarationName(name, fileName);

    let index = this.declarations.findIndex(decl => decl.symbol === symbol);

    if (index === -1) {
      this.declarations.unshift({ symbol, name: uid, originalName: name });
    }
  }

  get options(): Options {
    return this._options;
  }

  get program(): ts.Program {
    return this._program;
  }

  get checker(): ts.TypeChecker {
    return this._checker;
  }

}

export class TypeInfo {
  private _symbol?: ts.Symbol;
  private _TSR_DECLARATION: boolean;
  private _isTsrDeclaration: boolean;
  private _enclosing?: ts.Node;
  private _fileName?: string;
  private _declarations: ts.Declaration[];
  private _type: ts.Type;

  private _typeText: string;
  private _typeNode: ts.TypeNode;
  private _baseType?: ts.Type;
  private _baseTypeNode?: ts.TypeNode;
  private _baseTypeText?: string;

  private _isSynthesized: boolean;
  private _isReference: boolean;
  private _isLiteral: boolean;

  private _isExternalModule: boolean;
  private _isAmbient: boolean;
  private _isDeclaration: boolean;
  private _isExternal: boolean;
  private _isInDeclarationFile: boolean;

  constructor(private scanner: Scanner, enclosing: ts.Node) {
    this._enclosing = enclosing;
  }

  public isTsrDeclaration(): boolean {
    if (this._isTsrDeclaration === undefined) {
      if (this.isExternal && !this.scanner.options.libDeclarations && !this.isExternalModule) {
        return this._isTsrDeclaration = false;
      }

      this._isTsrDeclaration = this.TSR_DECLARATION &&
        this.scanner.isAllowedDeclarationSymbol(this.symbol)
        && (util.isPartOfTypeNode(this.enclosing) || (this.isInDeclarationFile));
    }

    return this._isTsrDeclaration;
  }

  public hasDeclarations(): boolean {
    return this.symbol && this.symbol.declarations && this.symbol.declarations.length > 0;
  }

  private get TSR_DECLARATION(): boolean {
    if (this._TSR_DECLARATION === undefined) {
      this._TSR_DECLARATION = ((this.isExternal && (this.isAmbient || this.isDeclaration || this.isInDeclarationFile) ||
        (!this.isExternal && (this.isDeclaration || this.isInDeclarationFile))));
    }

    return this._TSR_DECLARATION;
  }

  get symbol(): ts.Symbol {
    if (this._symbol === undefined) {
      this._symbol = this.scanner.getSymbol(this.type, this.enclosing);

      if (this._symbol === undefined) {
        this._symbol = null;
      }
    }

    return this._symbol;
  }

  get enclosing(): ts.Node {
    return this._enclosing;
  }

  // get sourceFile(): ts.SourceFile {
  //   return (this.firstDeclaration && this.firstDeclaration.getSourceFile()) || (this.enclosing && this.enclosing.getSourceFile());
  // }

  get sourceFiles(): ts.SourceFile[] {
    const sfs = this.declarations.map(declaration => declaration.getSourceFile());
    const esf = this.enclosing && this.enclosing.getSourceFile();

    if (sfs.indexOf(esf) === -1) {
      sfs.push(esf);
    }

    return sfs.filter(sf => !!(sf && ts.isSourceFile(sf)));
  }

  // get fileName(): string {
  //   return this.sourceFile && this.sourceFile.fileName;
  // }

  get fileNames(): string[] {
    return this.sourceFiles.map(sf => sf.fileName);
  }

  get declarations(): ts.Declaration[] {
    if (!this.symbol || !this.symbol.declarations) {
      return [];
    }

    return this.symbol.getDeclarations();
  }

  // get firstDeclaration(): ts.Declaration {
  //   return this.declarations[0];
  // }

  get type(): ts.Type {
    if (!this._type) {
      this._type = this.scanner.getType(this.enclosing);
    }

    return this._type;
  }

  get typeText(): string {
    if (!this._typeText) {
      this._typeText = this.scanner.checker.typeToString(this.type, this.enclosing);
    }

    return this._typeText;
  }

  get typeNode(): ts.TypeNode {
    if (!this._typeNode) {
      this._typeNode = this.scanner.getTypeNode(this.enclosing, this.type);
    }

    return this._typeNode;
  }

  get baseType(): ts.Type {
    if (this.isLiteral && !this._baseType) {
      this._baseType = this.scanner.getBaseType(this.type);
    }

    return this._baseType;
  }

  get baseTypeNode(): ts.TypeNode {
    if (this.isLiteral && !this._baseTypeNode) {
      this._baseTypeNode = this.scanner.checker.typeToTypeNode(this.baseType, this.enclosing);
    }

    return this._baseTypeNode;
  }

  get baseTypeText(): string {
    if (this.isLiteral && !this._baseTypeNode) {
      this._baseTypeText = this.scanner.checker.typeToString(this.baseType, this.enclosing);
    }

    return this._baseTypeText;
  }

  get isSynthesized(): boolean {
    if (this._isSynthesized === undefined) {
      this._isSynthesized = util.isSynthesized(this.typeNode);
    }

    return this._isSynthesized;
  }

  get isReference(): boolean {
    if (this._isReference === undefined) {
      this._isReference = ts.isTypeReferenceNode(this.typeNode)
    }

    return this._isReference;
  }

  get isLiteral(): boolean {
    if (this._isLiteral === undefined) {
      this._isLiteral = util.isLiteral(this.typeNode);
    }

    return this._isLiteral;
  }

  get isAmbient(): boolean {
    if (this.hasDeclarations() && this._isAmbient === undefined) {
      const results = this.declarations.map(declaration => util.isAmbient(declaration));
      this._isAmbient = results.indexOf(true) !== -1;
    }

    return this._isAmbient;
  }

  get isDeclaration(): boolean {
    if (this.hasDeclarations() && this._isDeclaration === undefined) {
      const results = this.declarations.map(declaration => util.isAmbientDeclaration(declaration));
      this._isDeclaration = results.indexOf(true) !== -1;
    }

    return this._isDeclaration;
  }

  get isInDeclarationFile(): boolean {
    if (this._isInDeclarationFile === undefined) {
      const results = this.sourceFiles.map(sf => sf.isDeclarationFile);
      this._isInDeclarationFile = results.indexOf(true) !== -1;
    }

    return this._isInDeclarationFile;
  }

  get isExternal(): boolean {
    if (this.hasDeclarations() && this._isExternal === undefined) {
      const results = this.sourceFiles.map(sf => this.scanner.pathIsExternal(sf.fileName));
      this._isExternal = results.indexOf(true) !== -1;
    }

    return this._isExternal;
  }

  get isExternalModule(): boolean {
    if (this.hasDeclarations() && this._isExternalModule === undefined) {
      const results = this.sourceFiles.map(sf => ts.isExternalModule(sf));
      this._isExternalModule = results.indexOf(true) !== -1;
    }

    return this._isExternalModule;
  }

}
