import * as ts from 'typescript';
import Config from './Config';
import { DEFAULT_CONFIG as DEFAULT_COMPILER_CONFIG } from '../compiler';

export const DEFAULT_CONFIG: Config = Object.assign({},
  {
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
  }, DEFAULT_COMPILER_CONFIG);

export default DEFAULT_CONFIG;
