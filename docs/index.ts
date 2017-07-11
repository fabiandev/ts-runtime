/// <reference path="../node_modules/monaco-editor/monaco.d.ts" />
/// <reference path="./loader.d.ts" />

import debounce = require('lodash.debounce');
import { FileReflection } from '../dist/transformModules';
import libs from './libs';
import * as TransformWorker from "worker-loader?name=worker.js!./worker";

let tsEditor: monaco.editor.IStandaloneCodeEditor;
let jsEditor: monaco.editor.IStandaloneCodeEditor;

const worker: Worker = new TransformWorker();

worker.onmessage = function(e) {
  if (e.data.name === 'transformed') {
    const transformed: FileReflection[] = e.data.data;

    const loading = document.getElementById('processing');
    loading.style.display = 'none';

    jsEditor.getModel().setValue(transformed[0].text);
  }

  if (e.data.name === 'log') {
    const message: any = e.data.data.message;
    const optionalParams: any[] = e.data.data.optionalParams;
    (console as any)[e.data.type](message, ...optionalParams);
    updateConsole(message, ...optionalParams);
  }
}

function init() {
  tsEditor = monaco.editor.create(document.getElementById('editor-ts'), {
    value: [
      'let foo: string;',
      'foo = 1 as any;'
    ].join('\n'),
    language: 'typescript',
    automaticLayout: true
  });

  jsEditor = monaco.editor.create(document.getElementById('editor-js'), {
    value: [
      'import t from "ts-runtime/lib";',
      'let _fooType = t.string(), foo;',
      'foo = _fooType.assert(1);',
      ''
    ].join('\n'),
    language: 'javascript',
    readOnly: true,
    automaticLayout: true
  });

  tsEditor.onDidChangeModelContent(debounce(onCodeChange, 500));

  document.getElementById('run-code').onclick = function() {
    runCode();
  };

  fadeOut(document.getElementById('loading'));
}

function clearConsole() {
  const element = document.getElementById('console-content');
  element.innerHTML = '';
}

function updateConsole(message: any, ...optionalParams: any[]) {
  const element = document.getElementById('console-content');
  let text = logToText(message);

  for (let param in optionalParams) {
    text += logToText(`<br>${param}`);
  }

  element.innerHTML = text;
}

function logToText(message: any) {
  if (typeof message == 'object' && message !== null) {
    return JSON.stringify(message);
  }

  return `${message}`;
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

function runCode() {
  const win = window.open('');
  win.document.head.innerHTML = '<title>ts-runtime Playground</title></head>';
  win.document.body.innerHTML = '<body><div id="indicator">Loading...</div></body>';

  const script = document.createElement('script');

  let contents = jsEditor.getValue();
  let libIdentifier = 't';

  const regex = /import(.*)from "ts-runtime\/lib";\s/ig;
  const matches = regex.exec(contents)

  if (matches !== null) {
    if (typeof matches[0] === 'string') {
      contents = contents.replace(matches[0], '')
    }

    if (typeof matches[1] === 'string') {
      libIdentifier = matches[1].trim();
    }
  }

  const lib = document.createElement('script');
  lib.innerHTML = `const ${libIdentifier} = window.t.default`;

  const code = document.createElement('script');
  code.innerHTML = contents;

  win.document.body.appendChild(script);

  script.onload = function() {
    win.document.getElementById('indicator').innerHTML = 'Ready.';
    win.document.body.appendChild(lib);
    win.document.body.appendChild(code);
  };

  script.src = `${window.location.href}/assets/ts-runtime.lib.js`;
}

function getLibs() {
  const libFiles = [];

  for (let lib in libs) {
    libFiles.push({ name: lib, text: libs[lib] });
  }

  return libFiles;
}

function onCodeChange(event: monaco.editor.IModelContentChangedEvent) {
  const modules = getLibs();

  modules.push({
    name: 'src/playground.ts',
    text: tsEditor.getValue()
  });

  clearConsole();

  const loading = document.getElementById('processing');
  loading.style.display = 'inline-block';

  worker.postMessage({
    name: 'transform',
    data: modules
  });
}

const win = window as any;
win.require.config({ paths: { 'vs': 'min/vs' }});
win.require(['vs/editor/editor.main'], init);
