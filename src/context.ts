import * as ts from 'typescript';
import * as util from './util';
import { Factory } from './factory';
import { Options, defaultOptions } from './options';
import { Scanner } from './scanner';

export class MutationContext {

  private _entryFilePath: string;
  private _options: Options;
  private _sourceFile: ts.SourceFile;
  private _program: ts.Program;
  private _checker: ts.TypeChecker;
  private _host: ts.CompilerHost;
  private _scanner: Scanner;
  private _skipNodes: ts.Node[];
  private _factory: Factory;
  private _transformationContext: ts.TransformationContext;
  private _merged: Set<ts.Symbol>;

  constructor(sourceFile: ts.SourceFile, options: Options, program: ts.Program, host: ts.CompilerHost, scanner: Scanner, context: ts.TransformationContext, entryFilePath: string) {
    if (!entryFilePath.endsWith('.ts')) {
      entryFilePath = `${entryFilePath}.ts`;
    }

    this._skipNodes = [];
    this._entryFilePath = entryFilePath;
    this._sourceFile = sourceFile;
    this._options = options;
    this._program = program;
    this._checker = program.getTypeChecker();
    this._host = host;
    this._scanner = scanner;
    this._factory = new Factory(this, options.compilerOptions.strictNullChecks, options.libIdentifier, options.libNamespace);
    this._transformationContext = context;
    this._merged = new Set();
  }

  // TODO: check if in scope
  public wasDeclared(node: ts.EntityName) {
    node = util.getIdentifierOfQualifiedName(node);

    const sourceFile = node.getSourceFile()
    const fileName = sourceFile && sourceFile.fileName;

    const declarations = this
      .getDeclarations(node)
      .filter(d => fileName === d.getSourceFile().fileName);

    for (let declaration of declarations) {
      if (declaration.getEnd() < node.getEnd()) {
        return true;
      }
    }

    return false;
  }

  // TODO: do not rely on typeName
  public isDeclared(node: ts.EntityName) {
    node = util.getIdentifierOfQualifiedName(node);

    const sourceFile = node.getSourceFile()
    const fileName = sourceFile && sourceFile.fileName;

    const declarations = this
      .getDeclarations(node)
      .filter(d => fileName === d.getSourceFile().fileName) || [];

    for (let declaration of declarations) {
      return true;
    }

    return false;
  }

  public isSelfReference(node: ts.TypeReferenceNode): boolean {
    let next: ts.Node = node;
    let typeSymbol = this.scanner.getNodeSymbol((node as ts.TypeReferenceNode).typeName)

    while (next.parent) {
      next = next.parent;

      if (ts.isClassDeclaration(next) || ts.isInterfaceDeclaration(next) || ts.isTypeAliasDeclaration(next)) {
        let symbol = this.scanner.getNodeSymbol(next.name || next);
        if (typeSymbol === symbol) {
          return true;
        }
      }
    }

    return false;
  }

  public hasSelfReference(node: ts.Node): boolean {
    let symbol = this.scanner.getNodeSymbol((node as any).name || node);

    // if (!symbol) {
    //   this.checker.getSymbolAtLocation((node as any).name || node);
    // }

    const search = (node: ts.Node): boolean => {
      if (ts.isTypeReferenceNode(node) && symbol === this.scanner.getNodeSymbol(node.typeName)) {
        return true;
      }

      return ts.forEachChild(node, child => search(child));
    }

    return search(node) || false;
  }

  public shouldSkip(node: ts.Node): boolean {
    if (this._skipNodes.indexOf(node) !== -1) {
      return true;
    }

    return false;
  }

  public skip<T extends ts.Node>(node: T, recursive = false, ...exclude: ts.Node[]): T {
    if (!this.shouldSkip(node) && exclude.indexOf(node) === -1) {
      this._skipNodes.push(node);
    }

    if (recursive) {
      ts.forEachChild(node, (n: ts.Node) => {
        this.skip(n, recursive, ...exclude);
      });
    }

    return node;
  }

  public dontSkip(node: ts.Node): boolean {
    const index = this._skipNodes.indexOf(node);

    if (index !== -1) {
      this._skipNodes.splice(index, 1);
      return true;
    }

    return false;
  }

  public getTypeDeclarationName(node: string | ts.BindingName): string {
    const name = typeof node === 'string' ? node : node.getText();
    return `${this.options.libNamespace}${name}Type`;
  }

  public getInlineTypeName(node: string | ts.BindingName): string {
    const name = typeof node === 'string' ? node : node.getText();
    return `${this.options.libNamespace}${name}TypeInline`;
  }

  public getReturnTypeDeclarationName(): string {
    return this.getTypeDeclarationName('return');
  }

  public getLibDeclarationName(): string {
    return `${this.options.libNamespace}${this.options.libIdentifier}`;
  }

  public getTypeSymbolDeclarationName(node: string | ts.BindingName): string {
    const name = typeof node === 'string' ? node : node.getText();
    return `${this.options.libNamespace}${name}TypeParametersSymbol`;
  }

  public getTypeSymbolDeclarationInitializer(node: string | ts.BindingName): string {
    const name = typeof node === 'string' ? node : node.getText();
    return `${name}TypeParameters`;
  }

  public getTypeParametersDeclarationName(): string {
    return `${this.options.libNamespace}typeParameters`;
  }

  // public getSymbol(node: ts.Node): ts.Symbol {
  //   return this.checker.getSymbolAtLocation(node);
  // }

  public getDeclarations(node: ts.Node): ts.Declaration[] {
    const symbol = this.scanner.getNodeSymbol(node);
    if (!symbol || !symbol.declarations) return [];
    return symbol.getDeclarations();
  }

  public isAny(node: ts.Node): boolean {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      return true;
    }

    const typeInfo = this.scanner.getTypeInfo(node);

    if (!typeInfo || !typeInfo.typeNode) {
      return false;
    }

    if (typeInfo.typeNode.kind === ts.SyntaxKind.AnyKeyword) {
      return true;
    }

    return false;
  }

  // TODO: also compare structural (e.g. Options = { /* structure that matches options */ })
  public isSafeAssignment(node: ts.Node, other: ts.Node, strict = false): boolean {
    const typeInfo = this.scanner.getTypeInfo(node);
    const otherTypeInfo = this.scanner.getTypeInfo(other);

    if (!typeInfo || !otherTypeInfo) {
      return false;
    }

    let nodeTypeText = typeInfo.typeText;
    let otherTypeText = otherTypeInfo.typeText;

    if (!nodeTypeText || !otherTypeText) {
      return false;
    }

    if (!strict && nodeTypeText === 'any') {
      return true;
    }

    if (!strict && !typeInfo.isLiteral && otherTypeInfo.isLiteral) {
      otherTypeText = otherTypeInfo.baseTypeText;
    }

    return nodeTypeText === otherTypeText;
  }

  public setMerged(symbol: ts.Symbol) {
    return this._merged.add(symbol);
  }

  public wasMerged(symbol: ts.Symbol) {
    return this._merged.has(symbol);
  }

  public isEntryFile(node: ts.SourceFile) {
    return node.fileName === this.entryFilePath;
  }

  // public getImplicitType(node: ts.Node): ts.Type {
  //   return this.checker.getTypeAtLocation(node);
  // }
  //
  // public getImplicitTypeNode(node: ts.Node): ts.TypeNode {
  //   return this.toTypeNode(this.getImplicitType(node), node);
  // }
  //
  // public getImplicitTypeText(node: ts.Node): string {
  //   return this.toTypeString(this.getImplicitType(node), node);
  // }
  //
  // public getContextualType(node: ts.Expression): ts.Type {
  //   return this.checker.getContextualType(node);
  // }
  //
  // public getContextualTypeNode(node: ts.Expression): ts.TypeNode {
  //   return this.toTypeNode(this.getContextualType(node), node);
  // }
  //
  // public getContextualTypeText(node: ts.Expression): string {
  //   return this.toTypeString(this.getContextualType(node), node);
  // }
  //
  // public getBaseType(node: ts.Node): ts.Type {
  //   // try {
  //   // return this.checker.getBaseTypes(this.getImplicitType(node));
  //   // return this.getImplicitType(node);
  //   // console.log('');
  //   // console.log('start')
  //   // const implicit = this.getImplicitType(node);
  //   //
  //   // if (implicit.flags & ts.TypeFlags.Literal) {
  //   //   // console.log('hm');
  //     return this.checker.getBaseTypeOfLiteralType(this.getImplicitType(node));
  //   // }
  //   // console.log('yep');
  //   // return implicit;
  //   // } catch (e) {
  //   //   console.log(e);
  //   //   console.log('');
  //   //   console.log(ts.SyntaxKind[node.kind]);
  //   //   console.log((node as any).name ? (node as any).name.getText() : '');
  //   //   console.log(node.getText());
  //   //   console.log('');
  //   //   throw e;
  //   // }
  // }
  //
  // public getBaseTypeNode(node: ts.Node): ts.TypeNode {
  //   return this.toTypeNode(this.getBaseType(node), node);
  // }
  //
  // public getBaseTypeText(node: ts.Node): string {
  //   return this.toTypeString(this.getBaseType(node), node);
  // }
  //
  // public toTypeNode(type: ts.Type, node: ts.Node) {
  //   return this.checker.typeToTypeNode(type, node.parent);
  // }
  //
  // public toTypeString(type: ts.Type, node: ts.Node) {
  //   return this.checker.typeToString(type, node.parent);
  // }
  //
  // public typeMatchesBaseType(node: ts.Node, other: ts.Node, matchIfAny = false): boolean {
  //   let nodeImplicitTypeText = this.getImplicitTypeText(node);
  //   let otherBaseTypeText: string;
  //
  //   // TODO: fix for e.g. CallExpression
  //   try {
  //     otherBaseTypeText = this.getBaseTypeText(other);
  //   } catch (e) {
  //     return false;
  //   }
  //
  //   if (matchIfAny && nodeImplicitTypeText === 'any') {
  //     return true;
  //   }
  //
  //   if (nodeImplicitTypeText !== otherBaseTypeText) {
  //     const otherTypeText = this.getImplicitTypeText(other);
  //
  //     if (nodeImplicitTypeText === otherTypeText) {
  //       return true;
  //     }
  //
  //     return false;
  //   }
  //
  //   return true;
  // }
  //
  // public implicitEqualsExplicitType(node: ts.Node): boolean {
  //   if (!(node as any).type) {
  //     return false;
  //   }
  //
  //   const implicit = this.toTypeString(this.checker.getApparentType(this.checker.getTypeAtLocation(node)), node);
  //
  //   if (implicit === 'any') {
  //     return true;
  //   }
  //
  //   const explicit = this.toTypeString(this.checker.getTypeFromTypeNode((node as any).type), node);
  //
  //   // console.log(`${implicit} === ${explicit}`);
  //
  //   return implicit === explicit;
  // }
  //
  // public typeMatchesBaseTypeOrAny(node: ts.Node, other: ts.Node): boolean {
  //   return this.typeMatchesBaseType(node, other, true);
  // }

  // getters and setters

  get transformationContext(): ts.TransformationContext {
    return this._transformationContext;
  }

  set transformationContext(transformationContext: ts.TransformationContext) {
    this._transformationContext = transformationContext;
  }

  public setTransformationContext(transformationContext: ts.TransformationContext): void {
    this.transformationContext = transformationContext;
  }

  get sourceFile(): ts.SourceFile {
    return this._sourceFile;
  }

  set sourceFile(sourceFile: ts.SourceFile) {
    if (ts.isSourceFile(sourceFile)) {
      throw new Error(`Attemt to set invalid node as SourceFile on MutationContext. Got ${ts.SyntaxKind[sourceFile.kind]}.`);
    }

    this._sourceFile = sourceFile;
  }

  public setSourceFile(sourceFile: ts.SourceFile): void {
    this.sourceFile = sourceFile;
  }

  get compilerOptions(): ts.CompilerOptions {
    return this._options.compilerOptions;
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

  get host(): ts.CompilerHost {
    return this._host;
  }

  get scanner(): Scanner {
    return this._scanner;
  }

  get factory(): Factory {
    return this._factory;
  }

  get map() {
    return this._scanner.mapNode.bind(this._scanner);
  }

  get entryFilePath(): string {
    return this._entryFilePath;
  }

}
