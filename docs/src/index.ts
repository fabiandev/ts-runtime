/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />
/// <reference path="./loader.d.ts" />
/// <reference path="./version.d.ts" />

/*
 * TODO: Playground
 * - Extensible compiler options
 * - Efficiently compute run code page
 * - Capture console output in run code page
 * - Possibility to tranform/run multiple file reflections
 * - Show tsr-declarations.js in transform result if emitted
 * - Use templates and two way binding (probably vue or react)
 */

import debounce = require('lodash.debounce');
import { FileReflection } from '../../src/host';
import { contents as lib } from 'monaco-typescript/lib/lib-es6-ts'
import * as TransformWorker from "worker-loader!./worker";

let tsEditor: monaco.editor.IStandaloneCodeEditor;
let jsEditor: monaco.editor.IStandaloneCodeEditor;
let result: FileReflection[];
let runWindow: Window;

const _editorJs = document.getElementById('editor-js');
const _editorTs = document.getElementById('editor-ts');
const _runCode = document.getElementById('run-code');
const _loading = document.getElementById('loading');
const _processing = document.getElementById('processing');
const _consoleContent = document.getElementById('console-content');
const _coStrictNullChecks = document.getElementById('co-strictNullChecks') as HTMLInputElement;

const worker: Worker = new TransformWorker();
worker.onmessage = onMessage;

const options = {
  strictNullChecks: true,
  rootDir: 'src',
  lib: ['lib.d.ts']
};

function bootstrap() {
  const win = window as any;
  win.require.config({ paths: { 'vs': 'min/vs' } });
  win.require(['vs/editor/editor.main'], init);
}

function init() {
  updateStrictNullChecksCheckbox();
  updateCompilerOptions();

  tsEditor = monaco.editor.create(_editorTs, {
    value: [
      'interface A<T> {',
      '    prop: T;',
      '}',
      '',
      'let a: A<string> = {',
      '    prop: 1 as any',
      '};',
      ''
    ].join('\n'),
    language: 'typescript',
    automaticLayout: true
  });

  jsEditor = monaco.editor.create(_editorJs, {
    value: '',
    language: 'javascript',
    readOnly: true,
    automaticLayout: true
  });

  tsEditor.onDidChangeModelContent(debounce(onCodeChange, 500));

  _runCode.onclick = function() {
    runCode();
  };

  _coStrictNullChecks.onclick = function(event) {
    options.strictNullChecks = (event.target as HTMLInputElement).checked;
    updateCompilerOptions();
    transform();
  };

  transform();

  fadeOut(_loading);
}

function transform(event?: monaco.editor.IModelContentChangedEvent) {
  const modules = [
    {
      name: 'lib.d.ts',
      text: lib
    },
    {
      name: 'src/playground.ts',
      text: tsEditor.getValue()
    }
  ];

  clearConsole();
  showProcessingIndicator();

  worker.postMessage({
    name: 'transform',
    entryFiles: ['src/playground'],
    reflections: modules,
    options: options
  });
}

function onMessage(e: MessageEvent) {
  if (e.data.name === 'transformed') {
    const transformed: FileReflection[] = e.data.data;

    hideProcessingIndicator();

    if (transformed && transformed.length !== 0) {
      result = transformed;
      jsEditor.getModel().setValue(transformed[0].text);
    }
  }

  if (e.data.name === 'log') {
    const message: any = e.data.data.message;
    const optionalParams: any[] = e.data.data.optionalParams;
    (console as any)[e.data.type](message, ...optionalParams);
    updateConsole(e.data.type, message, ...optionalParams);
  }
}

function onCodeChange(event: monaco.editor.IModelContentChangedEvent) {
  transform(event);
}

function updateCompilerOptions() {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    strictNullChecks: options.strictNullChecks,
    preserveConstEnums: true,
    allowNonTsExtensions: true
  });
}

function updateStrictNullChecksCheckbox() {
  _coStrictNullChecks.checked = options.strictNullChecks;
}

function clearConsole() {
  _consoleContent.innerHTML = '';
}

function wrapConsoleText(type: string, text: string): string {
  return `<span class="log-${type}"><span class="icon-${type}"></span>${text}</span>`;
}

function updateConsole(type: string, message: any, ...optionalParams: any[]): void {
  let text = logToText(message);

  for (let param of optionalParams) {
    text += `\n   ${logToText(param)}`;
  }

  text = wrapConsoleText(type, text);

  _consoleContent.innerHTML += `${text}\n`;
}

function logToText(message: any) {
  if (typeof message === 'object' && message !== null) {
    return JSON.stringify(message);
  }

  return `${escape(message)}`;
}

function escape(text: string): string {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

function fadeOut(target: HTMLElement) {
  target.style.opacity = '1';

  const fadeEffect = setInterval(() => {
    if (parseFloat(target.style.opacity) < 0.05) {
      clearInterval(fadeEffect);
      target.style.opacity = '0';
      target.style.display = 'none';
    } else {
      target.style.opacity = `${parseFloat(target.style.opacity) - 0.01}`;
    }
  }, 5);
}

function find<T>(input: T[], test: (element: T) => boolean): T {
  if (!Array.isArray(input)) {
    return null;
  }

  for (let el of input) {
    if (test(el)) {
      return el;
    }
  }

  return null;
}

function showProcessingIndicator() {
  _processing.style.display = 'inline-block';
}

function hideProcessingIndicator() {
  _processing.style.display = 'none';
}

function runCode() {
  let win: Window;
  let isReload = false;

  if (!runWindow || runWindow.closed) {
    win = window.open('', '', 'width=800,height=600');
    runWindow = win;
  } else {
    isReload = true;
    win = runWindow;
    win.location.reload();
  }

  setTimeout(() => {
    win.document.head.innerHTML = '<title>ts-runtime Playground</title>';

    const meta = document.createElement('meta');
    meta.charset = 'utf8';

    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.href = `${window.location.href}/assets/favicon.ico`;

    const normalizeCss = document.createElement('link');
    normalizeCss.rel = 'stylesheet';
    normalizeCss.href = `${window.location.href}/assets/normalize.css?${VERSION}`;

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `${window.location.href}/assets/style.css?${VERSION}`;

    const consoleWrapper = document.createElement('div');
    consoleWrapper.id = 'console-wrapper';

    const loading = document.createElement('div');
    loading.id = 'processing2';
    win.document.body.appendChild(loading);

    loading.innerHTML = `
<div class="spinner2">
  <div class="double-bounce1"></div>
  <div class="double-bounce2"></div>
</div>`;

    consoleWrapper.innerHTML = `
<div id="console" class="grid grid-pad">
  <div class="col-1-1">
    <div id="console-heading">
    Console Output:
    </div>
  </div>
  <div class="col-1-1">
    <div class="console" id="console-content"></div>
  </div>
</div>`;

    win.document.head.appendChild(meta);
    win.document.head.appendChild(icon);
    win.document.head.appendChild(normalizeCss);
    win.document.head.appendChild(style);

    win.document.body.appendChild(consoleWrapper);

    const cons = document.createElement('script');
    cons.innerHTML = `
function __getElement() {
  return document.getElementById('console-content');
}

function __clearConsole() {
  __getElement().innerHTML = '';
}

function __wrapConsoleText(type, text) {
  return '<span class="log-'+type+'"><span class="icon-'+type+'"></span>'+text+'</span>';
}

function __updateConsole(type, message, ...optionalParams) {
  let text = __logToText(message);

  for (let param of optionalParams) {
    text += \`\n   \` + __logToText(param);
  }

  text = __wrapConsoleText(type, text);

  __getElement().innerHTML += text + \`\n\`;
}

function __logToText(message) {
  if (typeof message === 'object' && message !== null) {
    return JSON.stringify(message);
  }

  return __escape(message);
}

function __escape(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

function __log(data) {
  const message = data.data.message;
  const optionalParams = data.data.optionalParams;
  if (data.log) data.log(message, ...optionalParams);
  __updateConsole(data.type, message, ...optionalParams);
}

function fadeOut(target) {
  target.style.opacity = '1';

  const fadeEffect = setInterval(() => {
    if (parseFloat(target.style.opacity) < 0.05) {
      clearInterval(fadeEffect);
      target.style.opacity = '0';
      target.style.display = 'none';
    } else {
      target.style.opacity = (parseFloat(target.style.opacity) - 0.02) + '';
    }
  }, 5);
}

var __originalLog = console.log;
console.log = function log(message, ...optionalParams) {
  __log({
    name: 'log',
    type: 'log',
    log: __originalLog,
    data: {
      message,
      optionalParams
    }
  });
}

var __originalInfo = console.info;
console.info = function info(message, ...optionalParams) {
  __log({
    name: 'log',
    type: 'info',
    log: __originalInfo,
    data: {
      message,
      optionalParams
    }
  });
}

var __originalWarn = console.warn;
console.warn = function warn(message, ...optionalParams) {
  __log({
    name: 'log',
    type: 'warn',
    log: __originalWarn,
    data: {
      message,
      optionalParams
    }
  });
}

var __originalError = console.error;
console.error = function error(message, ...optionalParams) {
  __log({
    name: 'log',
    type: 'error',
    log: __originalError,
    data: {
      message,
      optionalParams
    }
  });
}

window.onerror = function(message, url, lineNumber) {
  __log({
    name: 'error',
    type: 'error',
    // log: __originalError,
    data: {
      message,
      optionalParams: []
    }
  });
}`;

    win.document.head.appendChild(cons);

    const script = document.createElement('script');

    let contents: string;

    let contentsReflection = find(result, (element) => {
      return /src\/playground\.js$/.test(element.name);
    });

    if (contentsReflection) {
      contents = contentsReflection.text;
    } else {
      contents = jsEditor.getValue();
    }

    let declarations: string;

    let declarationsReflection = find(result, (element) => {
      return /tsr\-declarations\.js$/.test(element.name);
    });

    if (declarationsReflection) {
      declarations = declarationsReflection.text;
    }

    let libIdentifier = 't';

    const regexLib = /import(.*)from "ts-runtime\/lib";\s/ig;
    const matchesContentsLib = new RegExp(regexLib).exec(contents)

    if (matchesContentsLib !== null) {
      if (typeof matchesContentsLib[0] === 'string') {
        contents = contents.replace(matchesContentsLib[0], '')
      }

      if (typeof matchesContentsLib[1] === 'string') {
        libIdentifier = matchesContentsLib[1].trim();
      }
    }

    if (declarations) {
      const regexDeclarations = /import ".*tsr-declarations";\s/ig;
      const matchesContentsDeclarations = new RegExp(regexDeclarations).exec(contents);

      if (matchesContentsDeclarations !== null) {
        if (typeof matchesContentsDeclarations[0] === 'string') {
          contents = contents.replace(matchesContentsDeclarations[0], '')
        }
      }

      const matchesDeclarationsLib = new RegExp(regexLib).exec(declarations);

      if (matchesDeclarationsLib !== null) {
        if (typeof matchesDeclarationsLib[0] === 'string') {
          declarations = declarations.replace(matchesDeclarationsLib[0], '');
        }
      }
    }

    const lib = document.createElement('script');
    lib.innerHTML = `var ${libIdentifier} = window.t.default;`;

    const code = document.createElement('script');
    code.innerHTML = contents;

    win.document.body.appendChild(script);

    script.onload = function() {
      win.document.body.appendChild(lib);

      if (declarations) {
        let decl = document.createElement('script');
        decl.innerHTML = declarations;
        win.document.body.appendChild(decl);
      }

      win.document.body.appendChild(code);

      const hideLoader = document.createElement('script');
      hideLoader.innerHTML = `fadeOut(document.getElementById('processing2'));`;

      win.document.body.appendChild(hideLoader);
    };

    script.src = `${window.location.href}/assets/ts-runtime.lib.js?${VERSION}`;
  }, 100);
}

(() => bootstrap())();
