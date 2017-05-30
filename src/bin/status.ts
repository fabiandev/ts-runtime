import * as path from 'path';
import * as ora from 'ora';
import * as chalk from 'chalk';
import * as symbols from 'log-symbols';
import * as util from './util';

const version = require('../../package.json').version;
let spinner: any = ora();
let current = 'Processing';
let hasErrors = false;
let numDiagnostics = 0;

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

process.on('message', (data: { message: string, payload: any, info?: any }) => {
  if (typeof status[data.message] === 'function') {
    status[data.message](data.payload, data.info);
  }
});

const status: any = {};

status.init = () => {
  spinner = null;
  spinner = ora();
};

status.start = (args: any[]) => {
  current = 'Processing';
  spinner.info(chalk.bold(`ts-runtime v${version}`));
  spinner.text = current;
  spinner.start();
  return spinner;
};

status.transform = (fileNames: string[]) => {
  spinner.succeed(current);
  current = `Transforming`;
  spinner.text = chalk.bold(current);
  spinner.start();
  return spinner;
};

status.cleanup = (args: any[]) => {
  spinner.succeed(current);
  current = 'Cleanup';
  spinner.text = chalk.bold(current);
  spinner.start();
  return spinner;
};

status.diagnostics = (diags: string[], total?: number) => {
  const text = spinner.text;
  numDiagnostics += total || diags.length;

  spinner.fail(chalk.red(`${total || diags.length} TypeScript Compiler Diagnostics:`));

  for (let diag of diags) {
    spinner.fail(diag);
  }

  if (total > diags.length) {
    spinner.fail(chalk.bold(`Only showing first ${diags.length} diagnistics, ${total - diags.length} were hidden.`))
  }

  spinner.text = text;
  spinner.start();
  return spinner;
};

status.end = (args: any[]) => {
  spinner.succeed('Cleaning Up');
  if (hasErrors) {
    spinner.fail(chalk.red.bold(`Processing has finished, but there were errors.`));
  } else if (numDiagnostics > 0) {
    spinner.warn(chalk.yellow.bold(`Processing has finished, but there were ${numDiagnostics} compiler diagnostics.`));
  } else {
    spinner.succeed(chalk.green.bold('Processing has finished.'));
  }

  process.exit(0);
};

status.stop = (...args: any[]) => {
  hasErrors = true;
  status.error();
};

status.term = () => {
  hasErrors = true;

  spinner.fail(chalk.red.bold(`${current} was interrupted.`));
};

status.error = (error: string | Error) => {
  hasErrors = true;

  let err = util.getError(error);

  if (err) {
    spinner.fail(err);
  }

  status.term();
  process.exit(1);
};
