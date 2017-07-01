import * as t from 'flow-runtime';

const map: Map<string, any> = new Map();

const voidType = t.void;
const intersect = t.intersect;
const declare = t.declare;
const ref = t.ref;
const decorate = t.decorate;

t.decorate = (type: any, shouldAssert?: boolean) => {
  return (input: any, propertyName: any, descriptor: any, hm: any) => {
    const decorator = decorate.bind(t)(type, shouldAssert)(input, propertyName, descriptor);
    if (descriptor) descriptor.writable = true;
    input.writable = true;
    Object.defineProperty(input, propertyName, decorator);
  };
}

t.declare = (name: string, type: any) => {
  map.set(name, type);
  declare.bind(t)(name, type);
}

t.ref = (type: any, ...args: any[]) => {
  if (typeof type === 'string') {
    if (map.has(type)) {
      type = map.get(type);
    }
  }

  return ref.bind(t)(type, ...args);
}

// t.intersect = (...args: any[]) => {
//   return intersect.bind(t)(...args).unwrap();
// }
//
// t.intersection = (...args: any[]) => {
//   return t.intersect(...args);
// }

t.undef = () => {
  return voidType.bind(t)();
}

t.nostrict = (...args: any[]) => {
  return t.union(...args, t.null(), t.undef());
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
