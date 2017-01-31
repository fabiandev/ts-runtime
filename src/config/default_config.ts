import * as ts from 'typescript';
import { Config, ScriptTarget, ScriptKind } from './Config';
import DEFAULT_COMPILER_CONFIG from '../compiler/default_config';

export const DEFAULT_CONFIG: Config = Object.assign({},
  {
    languageVersion: ScriptTarget.ES6,
    scriptKind: ScriptKind.TS,
    setParentNodes: true,
  }, DEFAULT_COMPILER_CONFIG);

export default DEFAULT_CONFIG;
