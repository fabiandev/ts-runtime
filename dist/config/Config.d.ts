import { ScriptTarget, ScriptKind } from 'typescript';
import { CompilerConfig } from '../compiler/CompilerConfig';
export interface Config extends CompilerConfig {
    languageVersion?: ScriptTarget;
    scriptKind?: ScriptKind;
    setParentNodes?: boolean;
}
export { ScriptTarget, ScriptKind };
export default Config;
