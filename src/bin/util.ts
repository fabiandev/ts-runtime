import * as ts from 'typescript';
import * as chalk from 'chalk';
import { Options } from '../options';
import { ProgramError } from '../errors';

export function formatDiagnostics(diagnostics: ts.Diagnostic[]): string[] {
  let formatted: string[] = [];

  for (let diag of diagnostics) {
    formatted.push(ts.formatDiagnostics([diag], {
      getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
      getNewLine: () => ts.sys.newLine,
      getCanonicalFileName: (f: string) => f
    }).trim());
  }

  return formatted.filter(str => str.trim().length > 0);
}

export function getError(error: string | Error, options?: Options): string {
  let err = typeof error === 'string' ? error : '';
  let isProgramError = false;

  if (error instanceof Error) {
    if (error.stack) {
      err += error.stack;
    }

    if (error.message && err.indexOf(error.message) === -1) {
      err = err ? `${error.message} ${err}` : error.message;
    }

    if (error.name === ProgramError.id) {
      isProgramError = true;
      err = err.replace(`${ProgramError.id}: `, '');
    }
  }

  if (isProgramError) {
    const split = err.split('\n');
    const result = split.slice(0, 1);

    return result[0];
  } else if (options) {
    let limit = options.stackTraceOutput;
    limit = typeof limit === 'string' ? parseInt(limit) : limit;
    limit = limit < 0 ? 0 : limit;
    limit = limit === undefined ? 3 : limit;

    const lines = limit === 0 ? 1 : limit + 1;
    const split = err.split('\n');
    const result = split.slice(0, lines);

    if (limit > 0 && split.length > result.length) {
      result.push(chalk.bold(`    -> There are ${split.length - lines} more items on the stack trace. Use option -s ${split.length - 1} to show the full stack trace.`));
    }

    return result.join('\n');;
  }

  return err;
}
