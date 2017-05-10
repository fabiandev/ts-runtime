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
  private _visited: ts.Node[];
  private _factory: Factory;
  private _transformationContext: ts.TransformationContext;

  constructor(sourceFile: ts.SourceFile, options: Options, program: ts.Program, host: ts.CompilerHost, scanner: Scanner, context: ts.TransformationContext) {
    this._sourceFile = sourceFile;
    this._options = options;
    this._program = program;
    this._checker = program.getTypeChecker();
    this._host = host;
    this._scanner = scanner;
    this._visited = [];
    this._factory = new Factory(this, options.compilerOptions.strictNullChecks, options.libIdentifier, options.libNamespace);
    this._transformationContext = context;
  }

  public wasDeclared(node: ts.Node) {
    while (node.kind === ts.SyntaxKind.QualifiedName) {
      node = (node as ts.QualifiedName).left;
    }

    const declarations = this.getDeclarations(node);

    for (let declaration of declarations) {
      if (declaration.getEnd() < node.getEnd()) {
        return true;
      }
    }

    return false;
  }

  public hasSelfReference(node: ts.Node): boolean {
    const symbol = this.scanner.getSymbolFromNode((node as any).name || node);

    const search = (node: ts.Node): boolean => {
      const isTypeReference = node.kind === ts.SyntaxKind.TypeReference;
      const isSelfReference = symbol === this.scanner.getSymbolFromNode((node as ts.TypeReferenceNode).typeName);

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

  // public getSymbol(node: ts.Node): ts.Symbol {
  //   return this.checker.getSymbolAtLocation(node);
  // }

  public getDeclarations(node: ts.Node): ts.Declaration[] {
    const symbol = this.scanner.getSymbolFromNode(node);
    if (!symbol || !symbol.declarations) return [];
    return symbol.getDeclarations();
  }

  public isTypeNode(node: ts.Node): boolean {
    return node.kind >= ts.SyntaxKind.TypePredicate && node.kind <= ts.SyntaxKind.LiteralType;
  }

  public typesMatch(node: ts.Node, other: ts.Node, matchIfNodeIsAny = true, matchIfOtherIsAny = false): boolean {
    const nodeProperties = this.scanner.getPropertiesFromNode(node);
    const otherProperties = this.scanner.getPropertiesFromNode(other);

    if (!nodeProperties || !otherProperties) {
      return false;
    }

    let nodeTypeText = nodeProperties.typeText;
    let otherTypeText = otherProperties.typeText;

    if (!nodeTypeText || !otherTypeText) {
      return false;
    }

    if (matchIfNodeIsAny && nodeTypeText === 'any') {
      return true;
    }

    if (matchIfOtherIsAny && otherTypeText === 'any') {
      return true;
    }

    const nodeIsLiteral = this.isLiteral(nodeProperties.typeNode);
    const otherIsLiteral = this.isLiteral(otherProperties.typeNode);

    if (!nodeIsLiteral && otherIsLiteral) {
      otherTypeText = this.checker.typeToString(this.checker.getBaseTypeOfLiteralType(otherProperties.type));
    }

    console.log(`${nodeTypeText} === ${otherTypeText}`);

    return nodeTypeText === otherTypeText;
  }

  public isLiteral(node: ts.Node) {
    return [
      ts.SyntaxKind.NumericLiteral,
      ts.SyntaxKind.StringLiteral,
      ts.SyntaxKind.TrueKeyword,
      ts.SyntaxKind.FalseKeyword
    ].indexOf(node.kind) !== -1;
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

  get scanner(): Scanner {
    return this._scanner;
  }

  get factory(): Factory {
    return this._factory;
  }

}
