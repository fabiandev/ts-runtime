import * as EventEmitter from 'events';

export const events = {
  START: Symbol('start'),
  END: Symbol('end'),
  STOP: Symbol('stop'),
  ERROR: Symbol('error'),
  WARN: Symbol('warn'),
  DIAGNOSTICS: Symbol('ts.diagnostics'),
  TRANSFORM: Symbol('transform'),
  TRANSFORM_DONE: Symbol('transform.done'),
  CLEANUP: Symbol('cleanup'),
  CLEANUP_DONE: Symbol('cleanup.done'),
  INTERNAL_OPTIONS: Symbol('internal.options'),
};

export const emitter = new EventEmitter();
