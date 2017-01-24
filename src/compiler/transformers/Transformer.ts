import { Node } from 'typescript';
import { VisitorContext } from 'tspoon';

export abstract class Transformer {

  constructor(protected node: Node, protected context: VisitorContext) {

  }

  public abstract getReplacement(): string;
  public abstract replace(): void;

}
