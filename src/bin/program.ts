import * as cp from 'child_process';
import * as path from 'path';
import * as ora from 'ora';
import * as chalk from 'chalk';
import * as util from './util';
import { Options } from '../options';

export interface ProgramStatus {
  [index: string]: any;
  init: () => void;
  start: () => void;
  transform: (fileNames: string[], time: string) => void;
  scan: (time: string) => void;
  cleanup: (time: string) => void;
  diagnostics: (diags: string[], total?: number) => void;
  end: (time: string, totalTime: string) => void;
  warn: (warning: string, defer?: boolean) => void;
  stop: () => void;
  term: () => void;
  error: (error?: string | Error) => void;
}

let child: cp.ChildProcess;
let started = false;
let pkgVersion: string;
let spinner: any = ora();
let current = 'Processing';
let currentPast = 'Processed';
let hasErrors = false;
let numDiagnostics = 0;
let warnings: string[] = [];
let options: Options;

export function start(opts: Options, version: string) {
  pkgVersion = version;
  current = 'Processing';
  currentPast = 'Processed';
  hasErrors = false;
  numDiagnostics = 0;
  warnings = [];
  options = opts;
  status.init();
  status.start();
}

export function transform(entryFiles: string[]) {
  if (child) {
    return;
  }

  child = cp.fork(path.join(__dirname, './process'));
  started = true;

  child.on('exit', code => {
    status.term();
    child.stdin.end();
    child.kill();
    process.exit(code);
  });

  child.on('message', (data: { message: string, payload: any[] }) => {
    if (typeof status[data.message] === 'function') {
      if (Array.isArray(data.payload)) {
        status[data.message](...data.payload);
      } else {
        status[data.message](data.payload);
      }
    }
  });

  child.send({ message: 'startTransformation', payload: [entryFiles, options] });
}

export const status: ProgramStatus = {
  init: () => {
    spinner = null;
    spinner = ora();
  },

  start: () => {
    current = 'Processing';
    currentPast = 'Processed';
    if (!started) spinner.info(chalk.bold(`ts-runtime v${pkgVersion}`));
    spinner.text = current;
    spinner.start();
  },

  transform: (fileNames: string[], time: string) => {
    spinner.succeed(`${current} (${time})`);
    current = 'Transforming';
    currentPast = 'Transformed';
    spinner.text = chalk.bold(current);
    spinner.start();
  },

  emit: (time: string) => {
    spinner.succeed(`${current} (${time})`);
    current = 'Emitting';
    currentPast = 'Emitted';
    spinner.text = chalk.bold(current);
    spinner.start();
  },

  scan: (time: string) => {
    spinner.succeed(`${current} (${time})`);
    current = 'Scanning';
    currentPast = 'Scanned';
    spinner.text = chalk.bold(current);
    spinner.start();
  },

  cleanup: (time: string) => {
    spinner.succeed(`${current} (${time})`);
    current = 'Cleaning';
    currentPast = 'Cleaned';
    spinner.text = chalk.bold(current);
    spinner.start();
  },

  diagnostics: (diags: string[], total?: number) => {
    total = total || diags.length;
    numDiagnostics += diags.length;

    for (let diag of diags) {
      spinner.fail(diag);
    }

    if (total > diags.length) {
      spinner.fail(chalk.bold(`    -> ${total - diags.length} diagnostics have been hidden.`));
    }

    spinner.start();
  },

  end: (time: string, totalTime: string) => {
    spinner.succeed(`${current} (${time})`);

    for (let warning of warnings) {
      spinner.warn(chalk.yellow(warning));
    }

    if (hasErrors) {
      spinner.fail(chalk.red.bold(`Done in ${totalTime}, but there were errors.`));
    } else if (numDiagnostics > 0) {
      let wasWere = numDiagnostics === 1 ? 'was' : 'were';
      let diagPlural = numDiagnostics === 1 ? 'diagnostic' : 'diagnostics';
      let text = `Done in ${totalTime}, but there ${wasWere} ${numDiagnostics} compiler ${diagPlural}`;
      if (warnings.length > 0) {
        let warningPlural = warnings.length === 1 ? 'warning' : 'warnings';
        text += ` and ${warnings.length} ${warningPlural}`
      }
      spinner.succeed(chalk.yellow.bold(`${text}.`));
    } else if (warnings.length > 0) {
      let wasWere = warnings.length === 1 ? 'was' : 'were';
      let warningPlural = warnings.length === 1 ? 'warning' : 'warnings';
      spinner.succeed(chalk.yellow.bold(`Done in ${totalTime}, but there ${wasWere} ${warnings.length} ${warningPlural}.`));
    } else {
      spinner.succeed(chalk.green.bold(`Done in ${totalTime}.`));
    }

    process.exit(0);
  },

  warn: (warning: string, defer = true) => {
    if (warnings.indexOf(warning) === -1) {
      warnings.push(warning);
    } else

    if(!defer) {
      spinner.warn(warning);
    }
  },

  stop: () => {
    hasErrors = true;
    status.error();
  },

  term: () => {
    hasErrors = true;

    if (started) {
      spinner.fail(chalk.red.bold(`${current} was interrupted.`));
    }
  },

  error: (error?: string | Error) => {
    hasErrors = true;

    let err = util.getError(error);

    if (err) {
      spinner.fail(err);
    }

    status.term();
    process.exit(1);
  },
}

process.on('uncaughtException', (error: Error) => {
  status.error(error);
});

process.on('unhandledRejection', (reason: any, p: any) => {
  status.error(new Error(reason));
});

process.on('SIGINT', () => {
  status.term();
  process.exit(0);
});

process.on('SIGTERM', () => {
  status.term();
  process.exit(0);
});
