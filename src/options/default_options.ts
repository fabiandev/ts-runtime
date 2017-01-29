import * as ts from 'typescript';
import Options from './Options';

export const DEFAULT_OPTIONS: Options = {
  basePath: false,
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
  writePath: false,
};

export default DEFAULT_OPTIONS;
