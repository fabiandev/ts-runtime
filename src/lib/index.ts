import t from 'flow-runtime';

t._n = t.n;
t.n = (arg: any) => {
  return t.union(t.null(), arg);
};

export default t;
