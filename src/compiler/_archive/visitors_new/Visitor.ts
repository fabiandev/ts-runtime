import * as ts from 'typescript/built/local/typescript';

export abstract class Visitor {

  protected abstract filter(node: ts.Node): boolean;

  public abstract visit(node: ts.Node): ts.Node;

}
