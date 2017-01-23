import * as ts from 'typescript';
import { Processor } from './Processor';
import { ProcessorResult } from './ProcessorResult';

export class Preprocessor extends Processor {

  public process(): Promise<ProcessorResult> {
    return new Promise((resolve, reject) => {
      resolve(this.result);
    });
  }

}
