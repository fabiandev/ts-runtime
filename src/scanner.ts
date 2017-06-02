import * as ts from 'typescript';
import * as util from './util';

export interface TypeInfo {
  TSR_DECLARATION: boolean;
  enclosingDeclaration: ts.Node;
  sourceFile: ts.SourceFile;
  fileName: string;
  declarations: ts.Declaration[];
  type: ts.Type;
  typeText: string;
  typeNode: ts.TypeNode;
  baseType: ts.Type;
  baseTypeNode: ts.TypeNode;
  baseTypeText: string;
  isSynthesized: boolean;
  isReference: boolean;
  isLiteral: boolean;
  isAmbient: boolean;
  isDeclaration: boolean;
  isExternal: boolean;
  isInDeclarationFile: boolean;
  symbol: ts.Symbol;
  originalSymbol: ts.Symbol;
  aliasSymbol: ts.Symbol;
}

export class Scanner {

  private program: ts.Program;
  private checker: ts.TypeChecker;

  private declarations: Map<ts.Symbol, string[]> = new Map();
  private aliases: Map<ts.Node, ts.Node> = new Map();
  private properties: Map<ts.Node, TypeInfo> = new Map();

  private skip = [
    ts.SyntaxKind.ImportClause,
    ts.SyntaxKind.SourceFile,
    ts.SyntaxKind.BinaryExpression
  ];

  constructor(program: ts.Program) {
    this.program = program;
    this.checker = program.getTypeChecker();
  }

  public scan(): void {
    let sourceFiles = this.program.getSourceFiles().filter(sf => !sf.isDeclarationFile);

    for (let sourceFile of sourceFiles) {
      this.scanner(sourceFile);
    }
  }

  public mapNode<T extends ts.Node>(alias: T, original: ts.Node): T {
    this.aliases.set(alias, original);
    return alias;
  }

  public getTypeInfo(node: ts.Node): TypeInfo {
    return this.properties.get(this.getNode(node));
  }

  public hasTypeInfo(node: ts.Node): boolean {
    return this.properties.has(this.getNode(node));
  }

  public getNodeSymbol(node: ts.Node): ts.Symbol {
    return this.checker.getSymbolAtLocation(this.getNode(node));
  }

  public getDeclarations(): Map<ts.Symbol, string[]> {
    return this.declarations;
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
    while(this.aliases.has(node)) {
      node = this.aliases.get(node);
    }

    return node;
  }

  private scanner(sourceFile: ts.SourceFile): void {
    const scanNode = (node: ts.Node) => {
      if (!node) return;
      this.scanNode(node);
      ts.forEachChild(node, scanNode);
    };

    ts.forEachChild(sourceFile, scanNode);
  }

  private scanNode(node: ts.Node, useType?: ts.Type, enclosingDeclaration?: ts.Node): TypeInfo {
    if (!this.shouldScan(node)) {
      return;
    }

    node = this.mapAsExpression(node);
    enclosingDeclaration = enclosingDeclaration || node;

    const type = useType || this.getType(node);

    const symbol = type.aliasSymbol || type.symbol;
    const originalSymbol = type.symbol;
    const aliasSymbol = type.aliasSymbol;
    const typeNode = this.getTypeNode(node, type, enclosingDeclaration);
    const typeText = this.checker.typeToString(type, enclosingDeclaration);
    const isLiteral = util.isLiteral(typeNode);
    const isReference = typeNode.kind === ts.SyntaxKind.TypeReference;
    const isSynthesized = util.isSynthesized(typeNode);
    const baseType = isLiteral && this.getBaseType(type);
    const baseTypeNode = baseType && this.checker.typeToTypeNode(baseType, enclosingDeclaration);
    const baseTypeText = baseType && this.checker.typeToString(baseType, enclosingDeclaration);

    let declarations: ts.Declaration[];
    let sourceFile: ts.SourceFile;
    let fileName: string;
    let isAmbient: boolean;
    let isDeclaration: boolean;
    let isInDeclarationFile: boolean;
    let isExternal: boolean;

    if (isReference && this.hasDeclarations(symbol)) {
      declarations = symbol.getDeclarations();
      const firstDeclaration = declarations[0];
      sourceFile = firstDeclaration.getSourceFile();
      fileName = sourceFile.fileName;
      isAmbient = util.isAmbient(firstDeclaration);
      isDeclaration = util.isDeclaration(firstDeclaration);
      isInDeclarationFile = sourceFile.isDeclarationFile;
      isExternal = this.pathIsExternal(fileName);
    }

    const TSR_DECLARATION = isReference &&
      (isExternal && (isAmbient || isDeclaration || isInDeclarationFile) ||
        (!isExternal && (isDeclaration || isInDeclarationFile)));

    if (TSR_DECLARATION && symbol) {
      this.addDeclaration(symbol, fileName);
    }

    if (isSynthesized) {
      util.setParent(typeNode);
      this.mapNode(typeNode, node);

      console.log('scan synthesized');
      // scan synthesized
      this.scanSynthesizedTypeNode(typeNode, type, enclosingDeclaration);

    }

    // type, constraint, default, elementType, objectType, indexType
    // typeArguments, elementTypes, types

    // if (isReference && isSynthesized) {
    //   for (let i = 0; i < (type.aliasTypeArguments || []).length; i++) {
    //     const typeNodeTypeArgument = (typeNode as ts.TypeReferenceNode).typeArguments[i];
    //     this.scanNode(typeNodeTypeArgument, type.aliasTypeArguments[i], enclosingDeclaration);
    //   }
    //   // for each typeArgument (of ts.Type) that is a type reference, do something
    // }

    const typeInfo: TypeInfo = {
      TSR_DECLARATION, enclosingDeclaration, sourceFile, fileName,
      declarations, type, typeText, typeNode, baseType, baseTypeNode,
      baseTypeText, isSynthesized, isReference, isLiteral, isAmbient,
      isDeclaration, isExternal, isInDeclarationFile, symbol,
      originalSymbol, aliasSymbol,
    };

    this.properties.set(node, typeInfo);

    return typeInfo;
  }

  private scanSynthesizedTypeNode(typeNode: ts.TypeNode, type: ts.Type, enclosingDeclaration: ts.Node) {
    const tn = typeNode as any;
    const t = type as any;

    switch (typeNode.kind) {
      case ts.SyntaxKind.TypePredicate:
      case ts.SyntaxKind.ParenthesizedType:
      case ts.SyntaxKind.TypeOperator:
      case ts.SyntaxKind.MappedType:
        if (tn.type) {
          this.scanNode(tn.type, t.type, enclosingDeclaration);
        }
        break;
      // .type
      case ts.SyntaxKind.ArrayType:
        if (tn.elementType) {
          this.scanNode(tn.elementType, t.elementType, enclosingDeclaration);
        }
        break;
      // .elementType
      case ts.SyntaxKind.IndexedAccessType:
        if (tn.objectType) {
          this.scanNode(tn.objectType, t.objectType, enclosingDeclaration);
        }
        if (tn.indexType) {
          this.scanNode(tn.indexType, t.indexType, enclosingDeclaration);
        }
        break;
      // .objectType
      // .indexType
      case ts.SyntaxKind.TypeReference:
      case ts.SyntaxKind.ExpressionWithTypeArguments:
        if (tn.typeArguments) {
          for (let i = 0; i < (t.typeArguments || []).length; i++) {
            this.scanNode(tn.typeArguments[i], t.typeArguments[i], enclosingDeclaration);
          }
        }
        break;
      // .typeArguments[]
      case ts.SyntaxKind.TupleType:
        if (tn.elementTypes) {
          for (let i = 0; i < (t.elementTypes || []).length; i++) {
            this.scanNode(tn.elementTypes[i], t.elementTypes[i], enclosingDeclaration);
          }
        }
        break;
      // .elementTypes[]
      case ts.SyntaxKind.UnionType:
      case ts.SyntaxKind.IntersectionType:
        if (tn.types) {
          for (let i = 0; i < (t.types || []).length; i++) {
            this.scanNode(tn.types[i], t.types[i], enclosingDeclaration);
          }
        }
        break;
      // .types[]
    }
  }

  private shouldScan(node: ts.Node): boolean {
    if (!node) {
      return false;
    }

    if (this.skip.indexOf(node.kind) !== -1) {
      return false;
    }

    if (node.flags & ts.NodeFlags.Synthesized) {
      return false;
    }

    return true;
  }

  private mapAsExpression(node: ts.Node): ts.Node {
    if (node.kind === ts.SyntaxKind.AsExpression) {
      let expression = (node as ts.AsExpression).expression;
      this.mapNode(node, expression);

      return expression;
    }

    return node;
  }

  private getType(node: ts.Node): ts.Type {
    const isTypeNode = util.isTypeNode(node)

    if (isTypeNode) {
      return this.checker.getTypeFromTypeNode(node as ts.TypeNode);
    }

    if ((node as any).type) {
      return this.checker.getTypeFromTypeNode((node as any).type as ts.TypeNode);
    }

    return this.checker.getTypeAtLocation(node);
  }

  private getTypeNode(node: ts.Node, type: ts.Type, enclosingDeclaration?: ts.Node): ts.TypeNode {
    const isTypeNode = util.isTypeNode(node);

    if (isTypeNode) {
      return node as ts.TypeNode;
    }

    if ((node as any).type && util.isTypeNode((node as any).type)) {
      return (node as any).type as ts.TypeNode;
    }

    return this.checker.typeToTypeNode(type, enclosingDeclaration || node);
  }

  private getBaseType(type: ts.Type): ts.Type {
    return this.checker.getBaseTypeOfLiteralType(type);
  }

  private pathIsExternal(fileName: string): boolean {
    const rootDir = this.program.getCompilerOptions().rootDir;
    return !fileName.startsWith(rootDir);
  }

  private addDeclaration(symbol: ts.Symbol, fileName: string) {
    const hash = util.getHash(fileName);
    const name = this.checker.getFullyQualifiedName(symbol);
    const uid = `${name}.${hash}`;

    if (!this.declarations.has(symbol)) {
      this.declarations.set(symbol, [uid])
      return;
    }

    const names = this.declarations.get(symbol);

    if (names.indexOf(uid) === -1) {
      names.push(uid);
    }
  }

  private hasDeclarations(symbol: ts.Symbol): boolean {
    return symbol && symbol.declarations && symbol.declarations.length > 0;
  }

}
