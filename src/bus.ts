import * as EventEmitter from 'events';

export const events = {
  START: Symbol('start'),
  END: Symbol('end'),
  DIAGNOSTICS: Symbol('ts.diagnostics'),
  DIAGNOSTICS_TRANSFORM: Symbol('ts.diagnostics.transform'),
  DIAGNOSTICS_TRANSFORM_PRE: Symbol('ts.diagnostics.transform.pre'),
  DIAGNOSTICS_TRANSFORM_POST: Symbol('ts.diagnostics.transform.post'),
  DIAGNOSTICS_EMIT: Symbol('ts.diagnostics.emit'),
  DIAGNOSTICS_EMIT_PRE: Symbol('ts.diagnostics.emit.pre'),
  DIAGNOSTICS_EMIT_POST: Symbol('ts.diagnostics.emit.post'),
  TRANSFORM_START: Symbol('transform.start'),
  TRANSFORM_END: Symbol('transform.end'),
  // TRANSFORM_ERROR: Symbol('transform.error'),
  WRITE_START: Symbol('write.start'),
  WRITE_END: Symbol('write.end'),
  WRITE_FILE_START: Symbol('write.file.start'),
  WRITE_FILE_END: Symbol('write.file.end'),
  // WRITE_ERROR: Symbol('write.error'),
  EMIT_START: Symbol('emit.start'),
  EMIT_END: Symbol('emit.end'),
  // EMIT_ERROR: Symbol('emit.error'),
  TEMP_DELETE_START: Symbol('temp.delete.start'),
  TEMP_DELETE_END: Symbol('temp.delete.end'),
};

export const emitter = new EventEmitter();
