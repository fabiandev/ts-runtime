import t from 'flow-runtime';

t.n = (arg: any) => {
  return t.union(t.null(), arg);
};

export default t;
