import * as ts from 'typescript';
import * as util from './util';

export type Scope = ts.SourceFile | ts.Block | ts.ModuleBlock | ts.CaseBlock;

export class MutationContext {

  private _sourceFile: ts.SourceFile;
  private _scope: Scope;
  private _visited: ts.Node[];
  private _transformationContext: ts.TransformationContext;

  constructor(sf?: ts.SourceFile) {
    this._scope = sf;
    this._visited = [];
  }

  public wasVisited(node: ts.Node): boolean {
    if (this._visited.indexOf(node) !== -1) {
      return true;
    }

    return false;
  }

  public addVisited(node: ts.Node, recursive = false): void {
    if (!this.wasVisited(node)) {
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

  public setScope(node: ts.Node): void {
    this.scope = node;
  }

  public setTransformationContext(transformationContext: ts.TransformationContext): void {
    this.transformationContext = transformationContext;
  }

  public setSourceFile(sourceFile: ts.Node): void {
    this.sourceFile = sourceFile as ts.SourceFile;
  }

  get transformationContext() {
    return this._transformationContext;
  }

  set transformationContext(transformationContext: ts.TransformationContext) {
    this._transformationContext = transformationContext;
  }

  get visited() {
    return this._visited;
  }

  get scope() {
    return this._scope;
  }

  set scope(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.SourceFile:
        this._sourceFile = node as ts.SourceFile;
      case ts.SyntaxKind.Block:
      case ts.SyntaxKind.ModuleBlock:
      case ts.SyntaxKind.CaseBlock:
        this._scope = node as Scope;
        break;
      default:
      throw new Error(`Scope must be SourceFile, Block, ModuleBlock or CaseBlock, got ${ts.SyntaxKind[node.kind]}.`);
    }
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

}
