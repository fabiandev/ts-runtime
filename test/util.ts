import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import * as commondir from 'commondir';
import { ProgramError } from '../src/errors';
import { Scanner } from '../src/scanner';
import { Options } from '../src/options';
import { MutationContext } from '../src/context';
import { Host, FileReflection } from '../src/host';

let es6Lib: string;

export function program(host: Host, compilerOptions = options().compilerOptions): ts.Program {
  return ts.createProgram(['module.ts'], compilerOptions, host);
}

export function host(input: string, compilerOptions = options().compilerOptions): Host {
  return new Host(reflect(input)[1], compilerOptions);
}

export function scanner(program: ts.Program, opts = options()): Scanner {
  return new Scanner(program, opts);
}

export function resolveEntryFiles(entryFiles: string[]): string[] {
  return entryFiles.map(f => path.join(`${path.resolve(path.dirname(f))}`, path.basename(f)));;
}

export function commonDir(entryFiles: string[]): string {
  return commondir(resolveEntryFiles(entryFiles).map(f => path.dirname(f)));
}

export function context(program: ts.Program, host: Host, opts = options(), entryFiles = ['module.ts']): MutationContext {
  const resolvedEntryFiles = resolveEntryFiles(entryFiles);

  return new MutationContext(
    program.getSourceFile(resolvedEntryFiles[0]),
    opts,
    program,
    host,
    scanner(program, options),
    resolveEntryFiles(entryFiles),
    commonDir(resolvedEntryFiles)
    );
}

export function transform(input: string, options?: Options): string {
  const reflection = util.reflect(input);
  const rootName = reflection[0];
  const fileReflections = reflection[1];
  const opts = Object.assign(reflection[2], options || {});
  return tsr.transformReflection(rootName, fileReflections, opts)[0].text;
}

export function contains(expected: string, result: string): Expect.Assertion {
  return expect(normalize(result)).to.contain(normalize(expected));
}

export function compare(expected: string, result: string): Expect.Assertion {
  return expect(normalize(expected)).to.eql(normalize(result));
}

export function expectProgramError(fn: () => any): void {
  return expect(fn).to.throwException(e => {
    expect(e).to.be.a(Error);
    expect(e.name).to.equal(ProgramError.id);
  });
}

export function expectError(fn: () => any): void {
  return expect(fn).to.throwException(e => {
    expect(e).to.be.a(Error);
  });
}

export function lib(): string {
  if (es6Lib) return es6Lib;

  return fs.readFileSync(
    require.resolve('typescript/lib/lib.es6.d.ts'),
    { encoding: 'utf8' }
  );
}

export function options(): Options {
  return {
    force: true,
    compilerOptions: {
      skipLibCheck: true,
      strictNullChecks: true,
      target: ts.ScriptTarget.ES2015,
      module: ts.ModuleKind.ES2015,
      noEmitHelpers: true
    }
  };
}

export function reflect(input: string, name?: string): [string, FileReflection[], Options] {
  const fileReflections = [
    {
      name: name || 'module.ts',
      text: input
    }, {
      name: 'lib.d.ts',
      text: lib()
    }
  ];

  return [name || 'module.ts', fileReflections, options()];
}

export function normalize(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\{\s+/g, '{\n')
    .replace(/\s+\}/g, '\n}')
    .replace(/\[\s+/g, '[')
    .replace(/\s+]/g, ']')
    .replace(/\}\s+([A-Za-z])/g, '\n}\n$1')
    .replace(/([a-zA-Z]+)\.(\d+)/, '$1.__UID__')
    .split(';')
    .join(';\n')
    .trim()
    ;
}
