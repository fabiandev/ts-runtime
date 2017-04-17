export function getError(error: string | Error): string {
  let err = typeof error === 'string' ? error : '';

  if (error instanceof Error) {
    if (error.stack) {
      err += error.stack;
    }

    if (error.message && err.indexOf(error.message) === -1) {
      err = err ? `${error.message} ${err}` : error.message;
    }
  }

  return err;
}
