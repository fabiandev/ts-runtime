const f = () => {
    let _xType = t.ref(ComplexType), x = _xType.assert(() => {
        const a = t.boolean().assert(true);
        return a;
    });
    const b = t.number().assert(10);
    let _cType = t.string(), c;
    let _dType = t.array(t.boolean()), d = _dType.assert([true, false]);
    const e = t.array(t.array(t.array(t.number()))).assert([false]);
    c = 'hi';
    let _fType = t.tuple(t.ref(one), t.ref(two)), f;
};
