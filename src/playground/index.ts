import * as ts from 'typescript';
import debounce = require('lodash.debounce');
import { Options } from '../options';
import { FileReflection } from '../host';
import { contents as lib } from 'monaco-typescript/lib/lib-es6-ts.js';
import TransformWorker = require('worker-loader!./worker');
import runWindowHtmlConsole = require('./run-console.html');
import runWindowHtmlPlain = require('./run-plain.html');

interface PlaygroundOptions {
  [index: string]: any;
  tsrOptions: Options;
  compilerOptions: monaco.languages.typescript.CompilerOptions;
  windowOptions: WindowOptions;
}

interface WindowOptions {
  console?: boolean
}

interface HashValue {
  editor?: string;
  options?: PlaygroundOptions;
}

const worker: Worker = new TransformWorker();
worker.onmessage = onMessage;

const runWindowCodeConsole = prepareWindowCode(runWindowHtmlConsole);
const runWindowCodePlain = prepareWindowCode(runWindowHtmlPlain);

let tsEditor: monaco.editor.IStandaloneCodeEditor;
let jsEditor: monaco.editor.IStandaloneCodeEditor;
let result: FileReflection[];
let runWindow: Window;

const _editorJs = document.getElementById('editor-js');
const _editorTs = document.getElementById('editor-ts');
const _runCode = document.getElementById('run-code');
const _runText = document.getElementById('run-text')
const _loading = document.getElementById('loading');
const _processing = document.getElementById('processing');
const _optionsToggle = document.getElementById('options-toggle');
const _consoleContent = document.getElementById('console-content');
const _options = document.getElementById('options');
const _optionsList = (Array.prototype.slice.call(_options.getElementsByClassName('option'))).map((v: Element) => {
  return v.firstElementChild as HTMLInputElement | HTMLSelectElement;
});

let defaultOptions: Options;
(window as any).tsp = {
  options: {}
};

function setDefaultOptions(): void {
  defaultOptions = {
    tsrOptions: {
      force: true,
      noAnnotate: false,
      declarationPrefix: '_',
    },
    compilerOptions: {
      noImplicitAny: false,
      strictNullChecks: true,
      noImplicitReturns: false,
      noImplicitThis: false,
      removeComments: false,
      experimentalDecorators: true,
      emitDecoratorMetadata: false,
      allowNonTsExtensions: true,
      module: monaco.languages.typescript.ModuleKind.ES2015,
      target: monaco.languages.typescript.ScriptTarget.ES2015
    },
    windowOptions: {
      console: true
    }
  };
}

function bootstrap(): void {
  (document.getElementById('base') as HTMLBaseElement).href = getBaseHref();

  const win = window as any;
  win.require.config({ paths: { vs: MONACO_LOCATION } });

  (window as any).MonacoEnvironment = {
    getWorkerUrl: (workerId: any, label: any) => {
      return 'proxy.js';
    }
  };

  win.require([MONACO_ENTRY], init);
}

function init(): void {
  const hashValue = getHash();

  setDefaultOptions();
  expose();


  const defaultValue = hashValue && !!hashValue.editor ? hashValue.editor : [
    `console.info('ts-runtime v${VERSION}');`,
    '',
    'interface Foo<T> {',
    '    prop: T;',
    '}',
    '',
    'let a: Foo<number> = {',
    '    prop: \'bar\' as any',
    '};',
    ''
  ].join('\n');

  if (hashValue && hashValue.options) {
    setOptions(hashValue.options);
  }

  updateCompilerOptions();

  tsEditor = monaco.editor.create(_editorTs, {
    value: defaultValue,
    language: 'typescript',
    automaticLayout: true,
    minimap: {
      enabled: false
    },
    selectionClipboard: false
  });

  jsEditor = monaco.editor.create(_editorJs, {
    value: [
      '',
    ].join('\n'),
    language: 'javascript',
    readOnly: true,
    automaticLayout: true,
    minimap: {
      enabled: false
    },
    // contextmenu: false,
    quickSuggestions: false,
    parameterHints: false,
    autoClosingBrackets: false,
    suggestOnTriggerCharacters: false,
    snippetSuggestions: 'none',
    wordBasedSuggestions: false,
    selectionClipboard: false,
    // find: {
    //   seedSearchStringFromSelection: false,
    //   autoFindInSelection: false
    // }
  });

  ready();
}

function ready(): void {
  tsEditor.onDidChangeModelContent(debounce(onCodeChange, 400));
  _optionsToggle.onclick = toggleOptions;
  _runCode.onclick = runCode;
  initOptions();
  window.onkeydown = keyBindings;
  onCodeChange();
  fadeOut(_loading);
}

function expose() {
  (window as any).tsp.options = defaultOptions;
  (window as any).tsp.compile = onCodeChange;
  (window as any).tsp.emit = onCodeChange;
  (window as any).tsp.run = () => runCode();

  (window as any).tsp.sync = () => {
    initOptions();
    updateCompilerOptions();
  };

  (window as any).tsp.setCompilerOption = (name: string, value: any) => {
    (window as any).tsp.options.compilerOptions[name] = value;
    initOptions();
    updateCompilerOptions();
    onCodeChange();
  };
}

function initOptions() {
  const inputs = _optionsList;

  for (let i = 0; i < inputs.length; i++) {
    let input = inputs[i];
    let option = input.classList.item(0);

    if (options()[option].hasOwnProperty(input.name)) {
      if (input instanceof HTMLInputElement) {
        if ((input as HTMLInputElement).type === 'checkbox') {
          (input as HTMLInputElement).checked = !!defaultOptions[option][input.name];
        } else if ((inputs[i] as HTMLInputElement).type === 'text') {
          (input as HTMLInputElement).value = `${defaultOptions[option][input.name]}`;
        }
      } else if (input instanceof HTMLSelectElement) {
        (input as HTMLSelectElement).value = `${defaultOptions[option][input.name]}`;
      }
    }

    input.onchange = onOptionChange;
  }
}

function onOptionChange(this: HTMLInputElement | HTMLSelectElement, ev: Event): any {
  let option = this.classList.item(0);

  let value = options()[option][this.name];

  if (this instanceof HTMLInputElement) {
    if ((this as HTMLInputElement).type === 'checkbox') {
      value = !!(this as HTMLInputElement).checked;
    } else if ((this as HTMLInputElement).type === 'text') {
      value = (this as HTMLInputElement).value;
    }
  } else if (this instanceof HTMLSelectElement) {
    value = (this as HTMLSelectElement).value;
  } else {
    value = this.value;
  }

  options()[option][this.name] = value;

  updateCompilerOptions();
  onCodeChange();
  updateHash();
}

function onCodeChange(event?: monaco.editor.IModelContentChangedEvent): void {
  if (event !== void 0) {
    updateHash();
  }

  transform(event);
}

function keyBindings(this: Window, ev: KeyboardEvent) {
  if (ev.ctrlKey && ev.which === 82 /* r */) {
    runCode();
  }

  if ((ev.ctrlKey || ev.metaKey) && ev.which === 83 /* s */) {
    ev.preventDefault();
  }
}

function onMessage(e: MessageEvent) {
  if (e.data.name === 'transformed') {
    const transformed: FileReflection[] = e.data.data;
    const error: Error = e.data.error;

    hideErrorIndicator();
    hideProcessingIndicator();

    if (transformed && transformed.length !== 0 && transformed[0] && typeof transformed[0].text === 'string') {
      result = transformed;
      jsEditor.getModel().setValue(transformed[0].text);
    } else {
      showErrorIndicator();
    }
  }

  if (e.data.name === 'log') {
    if (e.data.type === 'error') {
      showErrorIndicator();
    }

    const message: any = e.data.data.message;
    const optionalParams: any[] = e.data.data.optionalParams || [];
    (console as any)[e.data.type](message, ...optionalParams);
    updateConsole(e.data.type, message, ...optionalParams);
  }
}

function transform(event?: monaco.editor.IModelContentChangedEvent): void {
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

  const playgroundOptions = getOptions();
  const opts = playgroundOptions.tsrOptions;
  opts.compilerOptions = playgroundOptions.compilerOptions;

  worker.postMessage({
    name: 'transform',
    entryFiles: ['src/playground'],
    reflections: modules,
    options: opts
  });
}

function runCode(): void {
  let win: Window;

  if (!runWindow || runWindow.closed) {
    windowOpened();
    win = window.open('', '', 'width=800,height=600');
    runWindow = win;
  } else {
    win = runWindow;
    windowRefreshed();
  }

  win.onunload = null;
  win.location.href = 'about:blank'

  setTimeout(() => {
    win.document.open()
    win.document.write(getWindowCode());
    win.document.close();
    win.onunload = windowUnloaded;
  }, 50);
}

function windowOpened() {
  _runText.innerText = 'Run in window';
}

function windowRefreshed() {
  _runText.innerText = 'Run in window';
}

function windowUnloaded() {
  _runText.innerText = 'Run in new window';
}

function updateHash(): void {
  const value = {
    editor: tsEditor.getValue(),
    options: getOptions()
  };

  window.location.hash = btoa(encodeURIComponent(JSON.stringify(value)));
}

function getHash(): HashValue {
  const hash = window.location.hash.substr(1);
  if (!hash) return {};
  return JSON.parse(decodeURIComponent(atob(hash)));
}

function updateJsEditor(text: string): void {
  jsEditor.getModel().setValue(text);
}

function updateCompilerOptions(): void {
  const compilerOptions = getCompilerOptions();
  compilerOptions.allowNonTsExtensions = true;
  compilerOptions.noEmit = true;
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
}

function setOptions(opts: { [index: string]: any }, base = (window as any).tsp.options) {
  for (let k in opts) {
    if (opts[k] !== null && typeof opts[k] === 'object') {
      setOptions(opts[k], base[k]);
    } else {
      base[k] = opts[k];
    }
  }
}

function options(): PlaygroundOptions {
  return (window as any).tsp.options;
}

function getOptions(): PlaygroundOptions {
  return JSON.parse(JSON.stringify(options()));
}

function getCompilerOptions(): Options {
  return JSON.parse(JSON.stringify(options().compilerOptions));
}

function getBaseHref(): string {
  return window.location.href.split('#')[0].replace(/\/?$/, '/');
}

function prepareWindowCode(html: string): string {
  return html
    .replace(new RegExp(/__BASE__/), getBaseHref())
    .replace(new RegExp(/__VERSION__/g), '/* @echo VERSION */');
}

function getWindowCode(html?: string): string {
  html = html !== void 0
   ? html : options().windowOptions.console
   ? runWindowCodeConsole : runWindowCodePlain;

  return html
    .replace(/__CODE__/, sanitizeRunCode(getJsCode()))
    .replace(/__CODE_TSR__/, sanitizeRunCode(getTsrCode()));
}

function getJsCode(): string {
  let resultReflection: FileReflection;
  let jsCode = '';

  if (result) {
    resultReflection = find(result, (element) => {
      return /src\/playground\.js$/.test(element.name);
    });
  }

  if (resultReflection && resultReflection.text) {
    jsCode = resultReflection.text;
  } else {
    jsCode = jsEditor.getValue();
  }

  return jsCode;
}

function getTsrCode(): string {
  let tsrReflection: FileReflection;
  let tsrCode = '';

  if (result) {
    tsrReflection = find(result, (element) => {
      return /tsr\-declarations\.js$/.test(element.name);
    });
  }

  if (tsrReflection && tsrReflection.text) {
    tsrCode = tsrReflection.text;
  }

  const libIdentifier = getLibIdentifier(getJsCode());

  let libDeclaration = `var ___t = ___t ? ___t : window.t.default;`;
  libDeclaration += `\nvar ${libIdentifier} = ___t;`;

  tsrCode = libDeclaration + '\n' + tsrCode;

  return tsrCode;
}

function sanitizeRunCode(text: string): string {
  let result = text;

  const regexLib = /import(.*)from "ts-runtime\/lib";\s/ig;
  const regexDeclarations = /import ".*tsr-declarations";\s/ig;

  const libMatches = new RegExp(regexLib).exec(text);

  if (libMatches !== null) {
    if (typeof libMatches[0] === 'string') {
      result = text.replace(libMatches[0], '');
    }
  }

  const declarationMatches = new RegExp(regexDeclarations).exec(result);

  if (declarationMatches !== null) {
    if (typeof declarationMatches[0] === 'string') {
      result = result.replace(declarationMatches[0], '')
    }
  }

  return result;
}

function getLibIdentifier(text: string): string {
  let libIdentifier = 't';

  const regexLib = /import(.*)from "ts-runtime\/lib";\s/ig;

  const libMatches = new RegExp(regexLib).exec(text);

  if (libMatches !== null) {
    if (typeof libMatches[1] === 'string') {
      libIdentifier = libMatches[1].trim();
    }
  }

  return libIdentifier;
}

function clearConsole(): void {
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

function logToText(message: any): string {
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

function toggleOptions(this: HTMLElement, ev: Event): void {
  this.classList.toggle('active');
  _options.classList.toggle('visible');
}

function showProcessingIndicator(): void {
  _processing.style.display = 'inline-block';
}

function hideProcessingIndicator(): void {
  _processing.style.display = 'none';
}

function showErrorIndicator(): void {
  _editorTs.style.border = '1px solid rgba(205, 92, 92, 0.4)';
}

function hideErrorIndicator(): void {
  _editorTs.style.border = null;
}

function fadeOut(target: HTMLElement, interval = 5, reduce = 0.01): void {
  target.style.opacity = '1';

  const fadeEffect = setInterval(() => {
    if (parseFloat(target.style.opacity) < 0.05) {
      clearInterval(fadeEffect);
      target.style.opacity = '0';
      target.style.display = 'none';
    } else {
      target.style.opacity = `${parseFloat(target.style.opacity) - reduce}`;
    }
  }, interval);
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

bootstrap();
