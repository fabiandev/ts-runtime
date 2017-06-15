import * as EventEmitter from 'events';

export const events = {
  START: Symbol('start'),
  END: Symbol('end'),
  STOP: Symbol('stop'),
  ERROR: Symbol('error'),
  WARN: Symbol('warn'),
  DIAGNOSTICS: Symbol('diagnostics'),
  TRANSFORM: Symbol('transform'),
  SCAN: Symbol('transform'),
  CLEANUP: Symbol('cleanup'),
};

export const emitter = new EventEmitter();
export const emit: typeof emitter.emit = emitter.emit.bind(emitter);
export const on: typeof emitter.on = emitter.on.bind(emitter);
