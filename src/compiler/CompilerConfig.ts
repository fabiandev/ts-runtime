import FileResult from './FileResult';

export interface CompilerConfig {
  files?: string[];
  mode?: 'substitute' | 'visit';
  visitChildrenFirst?: boolean;
}

export default CompilerConfig;
