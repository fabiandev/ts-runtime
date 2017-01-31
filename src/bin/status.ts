import * as path from 'path';
import * as ora from 'ora';
import * as chalk from 'chalk';

let spinner: any;
let fileCount: number = 0;
let processed: number = 0;
let errors: number = 0;

process.on('uncaughtException', (error: Error) => {
  status.error(error);
});

process.on('unhandledRejection', (reason: any, p: any) => {
  status.error(new Error(reason));
});

process.on('SIGINT', () => {
  status.term();
  process.exit();
});

process.on('SIGTERM', () => {
  status.term();
  process.exit();
});

process.on('message', (data: { message: string, payload: any }) => {
  if (typeof status[data.message] === 'function') {
    status[data.message](data.payload);
  }
});

const status: any = {};

status.init = () => {
  spinner = null;
  fileCount = 0;
  processed = 0;
  errors = 0;
  spinner = ora();
};

status.start = (num: number) => {
  fileCount = num;
  spinner.text = chalk.bold.underline(`Got ${num} file${num === 1 ? '' : 's'} to process`);
  spinner.stopAndPersist();
  spinner.text = `${processed}/${fileCount}`;
  spinner.start();
  return spinner;
};

status.end = () => {
  if (errors > 0) {
    spinner.fail(chalk.red(`There ${errors === 1 ? 'was' : 'were'} ${errors} error${errors === 1 ? '' : 's'}`));
  } else {
    spinner.succeed(chalk.green('All files have been processed'));
  }

  process.exit(0);
};

status.term = () => {
  spinner.fail(chalk.red('Processing was interrupted'));
};

status.fileStart = (filePath: string) => {
  processed++;
  spinner.text = `Processing ${filePath} (${processed}/${fileCount})`;
};

status.fileEnd = (filePath: string) => {
  // spinner.text = `${processed}/${fileCount}`;
  spinner.succeed(`Done processing ${filePath}`);
  spinner.start();
};

status.fileFail = (filePath: string) => {
  errors++;
  spinner.fail(`Error processing ${filePath}`);
  spinner.start();
};

status.fileReadError = (filePath: string) => {
  errors++;
  spinner.fail(`Could not read ${filePath}`);
  spinner.start();
};

status.error = (err: any) => {
  errors++;

  if (typeof err === 'string') {
    spinner.fail(chalk.red(err));
  }

  if (err instanceof Error) {
    spinner.fail(chalk.red(err.message));
  }

  process.exit();
};
