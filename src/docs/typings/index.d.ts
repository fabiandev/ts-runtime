/// <reference path="../../../node_modules/monaco-editor/monaco.d.ts" />

declare var VERSION: string;
declare var BUNDLE_NAME: string;
declare var MONACO_VERSION: string;
declare var MONACO_ENTRY: string;
declare var MONACO_BASE: string;
declare var MONACO_LOCATION: string;
declare var MONACO_LOADER: string;

declare module "*.html" {
  const content: any;
  export = content;
}

declare module "worker-loader*" {
  const content: any;
  export = content;
}
