import { TsRuntimeOptions } from '../options';
import { ProcessorResult } from './ProcessorResult';

export abstract class Processor {

  constructor(protected result: ProcessorResult) { }
  public abstract process(): Promise<ProcessorResult>;

}
