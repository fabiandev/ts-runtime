import * as ts from 'typescript';
import { TsRuntimeOptions } from './TsRuntimeOptions';

export const DEFAULT_OPTIONS: TsRuntimeOptions = {
  base: false,
  compilerOptions: {
    allowJs: true,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    // module: ts.ModuleKind.System,
    removeComments: false,
    sourceMap: false,
    target: ts.ScriptTarget.ES2015,
  },
  encoding: 'utf8',
  write: false,
};
