import * as t from 'flow-runtime';

const voidType = t.void;

t.undef = () => {
  return voidType();
}

t.nostrict = (...args: any[]) => {
  return t.union(...args, t.null())
}

t.void = () => {
  return t.union(t.null(), t.undef());
}

t.n = (...args: any[]) => {
  return t.nullable(...args);
}

t.enum = (...args: any[]) => {
  return t.union(...args);
}

t.enumMember = (arg: any) => {
  return t.number(arg);
}

t.enumRef = (...args: any[]) => {
  return t.typeOf(...args);
}

export default t;
