"use strict";
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");
const symbols = require("log-symbols");
let spinner;
let fileCount = 0;
let processed = 0;
let errors = 0;
process.on('uncaughtException', (error) => {
    status.error(error);
});
process.on('unhandledRejection', (reason, p) => {
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
process.on('message', (data) => {
    if (typeof status[data.message] === 'function') {
        status[data.message](data.payload);
    }
});
const status = {};
status.init = () => {
    spinner = null;
    fileCount = 0;
    processed = 0;
    errors = 0;
    spinner = ora();
};
status.start = (num) => {
    fileCount = num;
    spinner.text = chalk.bold(`Got ${num} file${num === 1 ? '' : 's'} to process:`);
    spinner.stopAndPersist();
    spinner.text = `${processed}/${fileCount}`;
    spinner.start();
    return spinner;
};
status.end = () => {
    if (errors > 0) {
        spinner.stopAndPersist({ symbol: symbols.warning, text: chalk.yellow(`All processing finished, but there ${errors === 1 ? 'was' : 'were'} ${errors} error${errors === 1 ? '' : 's'}`) });
    }
    else {
        spinner.succeed(chalk.green('All files have been processed'));
    }
    process.exit(0);
};
status.term = () => {
    spinner.fail(chalk.red('Processing was interrupted'));
};
status.fileStart = (filePath) => {
    processed++;
    const countStr = chalk.gray(`[${processed}/${fileCount}]`);
    spinner.text = `${countStr} Processing ${path.basename(filePath)}`;
};
status.fileEnd = (filePath) => {
    const countStr = chalk.gray(`[${processed}/${fileCount}]`);
    spinner.succeed(`${countStr} Done processing ${path.basename(filePath)}`);
    spinner.start();
};
status.fileFail = (filePath) => {
    errors++;
    const countStr = chalk.gray(`[${processed}/${fileCount}]`);
    spinner.fail(`${countStr} Error processing ${path.basename(filePath)}`);
    spinner.start();
};
status.fileReadError = (filePath) => {
    errors++;
    const countStr = chalk.gray(`[${processed}/${fileCount}]`);
    spinner.fail(`${countStr} Could not read ${path.basename(filePath)}`);
    spinner.start();
};
status.writeStart = (num) => {
    spinner.text = `Writing files`;
};
status.writeEnd = (num) => {
    spinner.succeed(`Wrote ${num} files`);
};
status.fileWriteStart = (filePath) => {
};
status.fileWriteEnd = (filePath) => {
};
status.error = (err) => {
    errors++;
    if (typeof err === 'string') {
        spinner.fail(chalk.red(err));
    }
    if (err instanceof Error) {
        spinner.fail(chalk.red(err.message));
    }
    process.exit();
};
