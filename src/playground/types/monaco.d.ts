import * as monaco from 'monaco-editor';

declare global {
  interface Window {
    MonacoEnvironment?: monaco.Environment;
    require: MonacoLoader;
    monaco: typeof monaco;
  }
}
