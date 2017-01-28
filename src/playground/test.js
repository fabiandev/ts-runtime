const f = () => {
    let _xType = t.ref(Function), x = _xType.assert(() => {
        const a = t.number().assert(true);
        return a;
    });
    const b = t.number().assert(10);
    let _cType = t.string(), c;
    let _dType = t.array(t.boolean()), d = _dType.assert([true, false]);
    c = 'hi';
};
