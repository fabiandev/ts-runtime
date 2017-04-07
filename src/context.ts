import * as ts from 'typescript';
import * as util from './util';
import { Factory } from './factory';
import { Options, defaultOptions } from './options';

export class MutationContext {

  private _options: Options;
  private _sourceFile: ts.SourceFile;
  private _program: ts.Program;
  private _checker: ts.TypeChecker;
  private _host: ts.CompilerHost;
  private _visited: ts.Node[];
  private _factory: Factory;
  private _transformationContext: ts.TransformationContext;

  constructor(options: Options, sourceFile: ts.SourceFile, program: ts.Program, host: ts.CompilerHost, context: ts.TransformationContext) {
    this._options = options;
    this._sourceFile = sourceFile;
    this._program = program;
    this._checker = program.getTypeChecker();
    this._host = host;
    this._visited = [];
    this._factory = new Factory(this, options.compilerOptions.strictNullChecks, options.libIdentifier, options.libNamespace);
    this._transformationContext = context;
  }

  public wasDeclared(node: ts.Node) {
    const declarations = this.getDeclarations(node);

    for (let declaration of declarations) {
      if (declaration.getEnd() < node.getEnd()) {
        return true;
      }
    }

    return false;
  }

  public hasSelfReference(node: ts.Node): boolean {
    const symbol = this.getSymbol((node as any).name || node);

    const search = (node: ts.Node): boolean => {
      const isTypeReference = node.kind === ts.SyntaxKind.TypeReference;
      const isSelfReference = symbol === this.getSymbol((node as ts.TypeReferenceNode).typeName);

      if (isTypeReference && isSelfReference) {
        return true;
      }

      return ts.forEachChild(node, child => search(child));
    }

    return search(node) || false;
  }

  public wasVisited(node: ts.Node): boolean {
    if (this._visited.indexOf(node) !== -1) {
      return true;
    }

    return false;
  }

  public addVisited(node: ts.Node, recursive = false, ...exclude: ts.Node[]): void {
    if (!this.wasVisited(node) && exclude.indexOf(node) === -1) {
      this._visited.push(node);
    }

    if (recursive) {
      ts.forEachChild(node, (n: ts.Node) => {
        this.addVisited(n, recursive, ...exclude);
      });
    }
  }

  public removeVisited(node: ts.Node): boolean {
    const index = this._visited.indexOf(node);

    if (index !== -1) {
      this._visited.splice(index, 1);
      return true;
    }

    return false;
  }

  public getTypeDeclarationName(node: string | ts.BindingName): string {
    const name = typeof node === 'string' ? node : node.getText();
    return `${this.options.libNamespace}${name}Type`;
  }

  public getLibDeclarationName(): string {
    return `${this.options.libNamespace}${this.options.libIdentifier}`;
  }

  public getSymbol(node: ts.Node): ts.Symbol {
    return this.checker.getSymbolAtLocation(node);
  }

  public getDeclarations(node: ts.Node): ts.Declaration[] {
    const symbol = this.getSymbol(node);
    if (!symbol || !symbol.declarations) return [];
    return symbol.getDeclarations();
  }

  public isTypeNode(node: ts.Node): boolean {
    return node.kind >= ts.SyntaxKind.TypePredicate && node.kind <= ts.SyntaxKind.LiteralType;
  }

  public getImplicitType(node: ts.Node): ts.Type {
    return this.checker.getTypeAtLocation(node);
  }

  public getImplicitTypeNode(node: ts.Node): ts.TypeNode {
    return this.checker.typeToTypeNode(this.getImplicitType(node));
  }

  public getImplicitTypeText(node: ts.Node): string {
    return this.checker.typeToString(this.getImplicitType(node));
  }

  public getContextualType(node: ts.Expression): ts.Type {
    return this.checker.getContextualType(node);
  }

  public getContextualTypeNode(node: ts.Expression): ts.TypeNode {
    return this.checker.typeToTypeNode(this.getContextualType(node));
  }

  public getContextualTypeText(node: ts.Expression): string {
    return this.checker.typeToString(this.getContextualType(node));
  }

  public getBaseType(node: ts.Node): ts.Type {
    return this.checker.getBaseTypeOfLiteralType(this.checker.getTypeAtLocation(node));
  }

  public getBaseTypeNode(node: ts.Node): ts.TypeNode {
    return this.checker.typeToTypeNode(this.getBaseType(node));
  }

  public getBaseTypeText(node: ts.Node): string {
    return this.checker.typeToString(this.getBaseType(node));
  }

  public typeMatchesBaseType(node: ts.Node, other: ts.Node, trueIfAny = false): boolean {
    let nodeImplicitTypeText = this.getImplicitTypeText(node);
    let otherBaseTypeText = this.getBaseTypeText(other);

    if (trueIfAny && nodeImplicitTypeText === 'any') {
      return true;
    }

    if (nodeImplicitTypeText !== otherBaseTypeText) {
      const otherTypeText = this.getImplicitTypeText(other);

      if (nodeImplicitTypeText === otherTypeText) {
        return true;
      }

      return false;
    }

    return true;
  }

  public typeMatchesBaseTypeOrAny(node: ts.Node, other: ts.Node): boolean {
    return this.typeMatchesBaseType(node, other, true);
  }

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

  get visited(): ts.Node[] {
    return this._visited;
  }

  get sourceFile(): ts.SourceFile {
    return this._sourceFile;
  }

  set sourceFile(sourceFile: ts.SourceFile) {
    if (!util.isKind(sourceFile, ts.SyntaxKind.SourceFile)) {
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

  get factory(): Factory {
    return this._factory;
  }

}
