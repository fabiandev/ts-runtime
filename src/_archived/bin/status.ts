import * as path from 'path';
import * as ora from 'ora';
import * as chalk from 'chalk';
import * as symbols from 'log-symbols';

let spinner: any;
let fileCount: number = 0;
let processed: number = 0;
let errors: number = 0;
let startWrite: number = 0;
let written: number = 0;

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
  startWrite = 0;
  written = 0;
  spinner = ora();
};

status.start = (num: number) => {
  fileCount = num;
  spinner.text = chalk.bold(`Got ${num} file${num === 1 ? '' : 's'} to process:`);
  spinner.stopAndPersist();
  spinner.text = `${processed}/${fileCount}`;
  spinner.start();
  return spinner;
};

status.end = () => {
  if (errors > 0) {
    const text = chalk.yellow(`Processing finished, but there ${errors === 1 ? 'was' : 'were'} ${errors} error${errors === 1 ? '' : 's'}`);
    spinner.stopAndPersist({ symbol: symbols.warning, text });
  } else {
    spinner.succeed(chalk.green('All files have been processed'));
  }

  if (written < startWrite) {
    const noFinish = startWrite - written;
    const text = chalk.yellow(`${written} file${written === 1 ? '' : 's'} ${written === 1 ? 'has' : 'have'} been written, ${noFinish} did not finish`);
    spinner.stopAndPersist({ symbol: symbols.warning, text });
  } else if (written > 0) {
    spinner.succeed(chalk.green(`${written} file${written === 1 ? '' : 's'} ${written === 1 ? 'has' : 'have'} been written`));
  }

  process.exit(0);
};

status.term = () => {
  spinner.fail(chalk.red('Processing was interrupted'));
};

status.fileStart = (filePath: string) => {
  processed++;
  const countStr = chalk.gray(`[${processed}/${fileCount}]`);
  spinner.text = `${countStr} Processing ${path.basename(filePath)}`;
};

status.fileEnd = (filePath: string) => {
  const countStr = chalk.gray(`[${processed}/${fileCount}]`);
  spinner.succeed(`${countStr} Done processing ${path.basename(filePath)}`);
  spinner.start();
};

status.fileFail = (filePath: string) => {
  errors++;
  const countStr = chalk.gray(`[${processed}/${fileCount}]`);
  spinner.fail(`${countStr} Error processing ${path.basename(filePath)}`);
  spinner.start();
};

status.fileReadError = (filePath: string) => {
  errors++;
  const countStr = chalk.gray(`[${processed}/${fileCount}]`);
  spinner.fail(`${countStr} Could not read ${path.basename(filePath)}`);
  spinner.start();
};

status.writeStart = (num: number) => {
  spinner.text = `Writing files`;
};

status.writeEnd = (num: number) => {
  spinner.succeed(`Wrote ${num} files`);
};

status.fileWriteStart = (filePath: string) => {
  startWrite++;
};

status.fileWriteEnd = (filePath: string) => {
  written++;
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
