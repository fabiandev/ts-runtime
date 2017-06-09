import * as t from 'flow-runtime';

const voidType = t.void;

t.undef = () => {
  return t.voidType();
}

t.void = () => {
  return t.union(t.null(), t.undef());
}

t.n = (...args: any[]) => {
  return t.nullable(...args);
}

export default t;
