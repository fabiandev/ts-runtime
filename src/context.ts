import * as path from 'path';
import * as ts from 'typescript';
import * as util from './util';
import { Factory } from './factory';
import { Options, defaultOptions } from './options';
import { Scanner } from './scanner';

export class MutationContext {

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
  private _entryFiles: string[];
  private _commonDir: string;

  constructor(sourceFile: ts.SourceFile, options: Options, program: ts.Program, host: ts.CompilerHost, scanner: Scanner, context: ts.TransformationContext, entryFiles: string[], commonDir: string) {
    this._skipNodes = [];
    this._sourceFile = sourceFile;
    this._options = options;
    this._program = program;
    this._checker = program.getTypeChecker();
    this._host = host;
    this._scanner = scanner;
    this._factory = new Factory(this, options);
    this._transformationContext = context;
    this._merged = new Set();
    this._entryFiles = entryFiles;
    this._commonDir = commonDir;
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

  public shouldSkip(node: ts.Node): boolean {
    if (this._skipNodes.indexOf(node) !== -1) {
      return true;
    }

    return false;
  }

  public dontSkip(node: ts.Node): boolean {
    const index = this._skipNodes.indexOf(node);

    if (index !== -1) {
      this._skipNodes.splice(index, 1);
      return true;
    }

    return false;
  }

  public isEntryFile(fileName: string) {
    return this._entryFiles.indexOf(fileName) !== -1;
  }

  public isImplementationOfOverload(node: ts.Node): node is ts.FunctionLikeDeclaration {
    return ts.isFunctionLike(node) && this.checker.isImplementationOfOverload(node);
  }

  public isDeclared(node: ts.EntityName): boolean {
    node = util.getIdentifierOfEntityName(node);

    const typeInfo = this.scanner.getTypeInfo(node);
    const fileName = typeInfo.fileName;

    const declarations = typeInfo.declarations
      .filter(d => fileName === d.getSourceFile().fileName) || [];

    if (declarations.length > 0) {
      return true;
    }

    return false;
  }

  public wasDeclared(node: ts.EntityName): boolean {
    node = util.getIdentifierOfEntityName(node);

    const typeInfo = this.scanner.getTypeInfo(node);
    const fileName = typeInfo.fileName;

    const declarations = typeInfo.declarations
      .filter(d => fileName === d.getSourceFile().fileName);

    for (let declaration of declarations) {
      if (declaration.getEnd() < node.getEnd()) {
        return true;
      }
    }

    return false;
  }

  public pathIsOutsideRoot(fileName: string): boolean {
    const rootDir = this.program.getCompilerOptions().rootDir + path.sep;
    return !path.resolve(fileName).startsWith(path.resolve(rootDir));
  }

  public isAny(node: ts.Node): boolean {
    if (util.isAnyKeyword(node)) {
      return true;
    }

    const typeInfo = this.scanner.getTypeInfo(node);

    if (!typeInfo || !typeInfo.typeNode) {
      return false;
    }

    if (util.isAnyKeyword(typeInfo.typeNode)) {
      return true;
    }

    return false;
  }

  public isSelfReference(node: ts.TypeReferenceNode): boolean {
    let next: ts.Node = node;

    const typeInfo = this.scanner.getTypeInfo((node as any).name || node);

    while (next.parent) {
      next = next.parent;

      if (ts.isClassDeclaration(next) || ts.isInterfaceDeclaration(next) || ts.isTypeAliasDeclaration(next)) {
        const symbol = this.scanner.getTypeInfo(next.name || next).symbol;

        if (typeInfo.symbol === symbol) {
          return true;
        }
      }
    }

    return false;
  }

  public isSafeAssignment(node: ts.Node, other: ts.Node, strict = false): boolean {
    if (this.options.assertSafe) {
      return false;
    }

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

  public hasSelfReference(node: ts.Node): boolean {
    const typeInfo = this.scanner.getTypeInfo((node as any).name || node);

    const search = (node: ts.Node): boolean => {
      if (ts.isTypeReferenceNode(node)) {
        const symbol = this.scanner.getTypeInfo(node.typeName).symbol;

        if (typeInfo.symbol === symbol) {
          return true;
        }
      }

      return ts.forEachChild(node, child => search(child));
    }

    return search(node) || false;
  }

  public getTypeDeclarationName(node: string | ts.Identifier): string {
    const name = typeof node === 'string' ? node : node.text;
    return `${this.options.declarationNamespace}${name}Type`;
  }

  public getInlineTypeName(node: string | ts.Identifier): string {
    const name = typeof node === 'string' ? node : node.text;
    return `${this.options.declarationNamespace}${name}TypeInline`;
  }

  public getReturnTypeDeclarationName(): string {
    return this.getTypeDeclarationName('return');
  }

  public getLibDeclarationName(): string {
    return `${this.options.libNamespace}${this.options.libIdentifier}`;
  }

  public getTypeSymbolDeclarationName(node: string | ts.Identifier): string {
    const name = typeof node === 'string' ? node : node.text;
    return `${this.options.declarationNamespace}${name}TypeParametersSymbol`;
  }

  public getTypeSymbolDeclarationInitializer(node: string | ts.Identifier): string {
    const name = typeof node === 'string' ? node : node.text;
    return `${name}TypeParameters`;
  }

  public getTypeParametersDeclarationName(): string {
    return `${this.options.declarationNamespace}typeParameters`;
  }

  public getMembers(node: ts.ClassDeclaration | ts.ClassExpression | ts.InterfaceDeclaration | ts.TypeLiteralNode): (ts.TypeElement | ts.ClassElement)[] {
    const typeInfo = this.scanner.getTypeInfo(node);
    const merged: Set<ts.TypeElement | ts.ClassElement> = new Set();
    let type: ts.Type = typeInfo.type;

    if (!type) {
      return util.asArray(node.members as (ts.TypeElement | ts.ClassElement)[]);
    }

    const members: ts.Symbol[] = [];

    typeInfo.symbol.members.forEach((member, key) => {
      if (member.flags & ts.SymbolFlags.TypeParameter) {
        return;
      }

      members.push(member);
    });

    members.forEach(sym => {
      for (let typeElement of ((sym.getDeclarations() || []) as (ts.TypeElement | ts.ClassElement)[])) {
        merged.add(typeElement);
      }
    });

    return Array.from(merged);
  }

  public setMerged(symbol: ts.Symbol) {
    return this._merged.add(symbol);
  }

  public wasMerged(symbol: ts.Symbol) {
    return this._merged.has(symbol);
  }

  public setTransformationContext(transformationContext: ts.TransformationContext): void {
    this.transformationContext = transformationContext;
  }

  public setSourceFile(sourceFile: ts.SourceFile): void {
    this.sourceFile = sourceFile;
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

  get transformationContext(): ts.TransformationContext {
    return this._transformationContext;
  }

  set transformationContext(transformationContext: ts.TransformationContext) {
    this._transformationContext = transformationContext;
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

  get map(): <T extends ts.Node>(alias: T, original: ts.Node) => T {
    return this._scanner.mapNode.bind(this._scanner);
  }

  get entryFiles(): string[] {
    return this._entryFiles;
  }

  get commonDir(): string {
    return this._commonDir;
  }

}
