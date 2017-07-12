/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />
/// <reference path="./loader.d.ts" />

import debounce = require('lodash.debounce');
import { FileReflection } from '../../src/transformModules';
import { contents as lib } from 'monaco-typescript/lib/lib-es6-ts'
import * as TransformWorker from "worker-loader!./worker";

let tsEditor: monaco.editor.IStandaloneCodeEditor;
let jsEditor: monaco.editor.IStandaloneCodeEditor;

const worker: Worker = new TransformWorker();

let result: FileReflection[];

worker.onmessage = function(e) {
  if (e.data.name === 'transformed') {
    const transformed: FileReflection[] = e.data.data;

    const loading = document.getElementById('processing');
    loading.style.display = 'none';

    result = transformed;
    jsEditor.getModel().setValue(transformed[0].text);
  }

  if (e.data.name === 'log') {
    const message: any = e.data.data.message;
    const optionalParams: any[] = e.data.data.optionalParams;
    (console as any)[e.data.type](message, ...optionalParams);
    updateConsole(e.data.type, message, ...optionalParams);
  }
}

function init() {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    strictNullChecks: true,
    preserveConstEnums: true,
    allowNonTsExtensions: true
  });

  tsEditor = monaco.editor.create(document.getElementById('editor-ts'), {
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

  jsEditor = monaco.editor.create(document.getElementById('editor-js'), {
    value: '',
    language: 'javascript',
    readOnly: true,
    automaticLayout: true
  });

  tsEditor.onDidChangeModelContent(debounce(onCodeChange, 500));

  document.getElementById('run-code').onclick = function() {
    runCode();
  };

  transform();

  fadeOut(document.getElementById('loading'));
}

function clearConsole() {
  const element = document.getElementById('console-content');
  element.innerHTML = '';
}

function wrapConsoleText(type: string, text: string): string {
  return `<span class="log-${type}"><span class="icon-${type}"></span>${text}</span>`;
}

function updateConsole(type: string, message: any, ...optionalParams: any[]): void {
  const element = document.getElementById('console-content');
  let text = logToText(message);

  for (let param in optionalParams) {
    text += `\n   logToText(param)`;
  }

  text = wrapConsoleText(type, text);

  element.innerHTML += text;
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

function runCode() {
  const win = window.open('');
  win.document.head.innerHTML = '<title>ts-runtime Playground</title></head>';
  win.document.body.innerHTML = '<body><div id="indicator">Loading...</div></body>';

  const script = document.createElement('script');

  let contents: string;

  let contentsReflection = find(result, (element) => {
    return element.name === 'src/playground.js';
  });

  if (contentsReflection) {
    contents = contentsReflection.text;
  } else {
    contents = jsEditor.getValue();
  }

  let declarations: string;

  let declarationsReflection = find(result, (element) => {
    return element.name === 'tsr-declarations.js';
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

    win.document.getElementById('indicator').innerHTML = 'Ready.';
  };

  script.src = `${window.location.href}/assets/ts-runtime.lib.js`;
}

// function getLibs() {
//   const libFiles = [];
//
//   for (let lib in libs) {
//     libFiles.push({ name: lib, text: libs[lib] });
//   }
//
//   return libFiles;
// }

function transform(event?: monaco.editor.IModelContentChangedEvent) {
  const modules = [
    {
      name: 'lib.es6.d.ts',
      text: lib
    },
    {
      name: 'src/playground.ts',
      text: tsEditor.getValue()
    }
  ];

  clearConsole();

  const loading = document.getElementById('processing');
  loading.style.display = 'inline-block';

  worker.postMessage({
    name: 'transform',
    data: modules
  });
}

function onCodeChange(event: monaco.editor.IModelContentChangedEvent) {
  transform(event);
}

const win = window as any;
win.require.config({ paths: { 'vs': 'min/vs' } });
win.require(['vs/editor/editor.main'], init);
