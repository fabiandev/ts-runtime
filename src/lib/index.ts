import * as t from 'flow-runtime';

const voidType = t.void;
const intersect = t.intersect;

t.intersect = (...args: any[]) => {
  return intersect.bind(t)(...args).unwrap();
}

t.intersection = (...args: any[]) => {
  return t.intersect(...args);
}

t.undef = () => {
  return voidType.bind(t)();
}

t.nostrict = (...args: any[]) => {
  return t.bind(t).union(...args, t.null.bind(t)())
}

t.void = () => {
  return t.union.bind(t)(
    t.null.bind(t)(),
    t.undef.bind(t)()
  );
}

t.n = (...args: any[]) => {
  return t.nullable.bind(t)(...args);
}

t.enum = (...args: any[]) => {
  return t.union.bind(t)(...args);
}

t.enumMember = (arg: any) => {
  return t.number.bind(t)(arg);
}

t.enumRef = (...args: any[]) => {
  return t.typeOf.bind(t)(...args);
}

export default t;
