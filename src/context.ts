import * as ts from 'typescript';
import * as util from './util';
import { Options, defaultOptions } from './options';

export class MutationContext {

  private _options: Options;
  private _sourceFile: ts.SourceFile;
  private _program: ts.Program;
  private _checker: ts.TypeChecker;
  private _host: ts.CompilerHost;
  private _visited: ts.Node[];
  private _transformationContext: ts.TransformationContext;

  constructor(options: Options, sourceFile: ts.SourceFile, program: ts.Program, host: ts.CompilerHost, context: ts.TransformationContext) {
    this._options = options;
    this._sourceFile = sourceFile;
    this._program = program;
    this._checker = program.getTypeChecker();
    this._host = host;
    this._visited = [];
    this._transformationContext = context;
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
        this.addVisited(n, recursive);
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

  // TODO: implement
  public getTypeDeclarationName(node: string | ts.BindingName): string {
    const name = typeof node === 'string' ? node : node.getText();
    return `_${name}Type`;
  }

  // TODO: implement
  public getLibDeclarationName(): string {
    return '';
  }

  // TODO: handle LastTypeNode (and FirstTypeNode)
  public getImplicitTypeNode(node: string | ts.Node): ts.TypeNode {
    const typeString = typeof node === 'string' ? node : this.getImplicitTypeText(node);
    let source = `let temp: ${typeString};`;
    let sf = ts.createSourceFile('temp', source, this.compilerOptions.target || defaultOptions.compilerOptions.target, true, ts.ScriptKind.TS);
    return (sf.statements[0] as ts.VariableStatement).declarationList.declarations[0].type;
  }

  public getImplicitTypeText(node: ts.Node): string {
    const type = this.checker.getTypeAtLocation(node);
    return this.checker.typeToString(type);
  }

  public getType(node: ts.Node): ts.Type {
    return this.checker.getTypeAtLocation(node);
  }

  public getTypeFlag(node: ts.Node): ts.TypeFlags {
    return this.getType(node).flags;
  }

  public getTypeFlagString(node: ts.Node): string {
    return ts.TypeFlags[this.getTypeFlag(node)];
  }

  // getters and setters

  get transformationContext() {
    return this._transformationContext;
  }

  set transformationContext(transformationContext: ts.TransformationContext) {
    this._transformationContext = transformationContext;
  }

  public setTransformationContext(transformationContext: ts.TransformationContext): void {
    this.transformationContext = transformationContext;
  }

  get visited() {
    return this._visited;
  }

  get sourceFile() {
    return this._sourceFile;
  }

  set sourceFile(sourceFile: ts.SourceFile) {
    if (!util.isKind(sourceFile, ts.SyntaxKind.SourceFile)) {
      throw new Error(`Attemt to set invalid node as SourceFile, got ${ts.SyntaxKind[sourceFile.kind]}.`);
    }

    this._sourceFile = sourceFile;
  }

  public setSourceFile(sourceFile: ts.Node): void {
    this.sourceFile = sourceFile as ts.SourceFile;
  }

  get compilerOptions() {
    return this._options.compilerOptions;
  }

  get options() {
    return this._options;
  }

  get program() {
    return this._program;
  }

  get checker() {
    return this._checker;
  }

  get host() {
    return this._host;
  }

}
