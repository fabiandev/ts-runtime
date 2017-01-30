type ComplexType = {
};
type one = {
};
type two = {
};
function f(param1: boolean, param2?: string[]): string {
    let _param1Type = t.boolean(), _param2Type = t.array(t.string());
    t.param("param1", _param1Type, false).assert(param1);
    t.param("param2", _param2Type, true).assert(param2);
    let _xType = t.ref(ComplexType), x = _xType.assert(() => {
        const a = t.boolean().assert(true);
        return a;
    });
    const b = t.number().assert(10);
    let _cType = t.string(), c;
    let _dType = t.array(t.boolean()), d = _dType.assert([true, false]);
    const e = t.array(t.array(t.array(t.number()))).assert([[[10]]]);
    c = 'hi';
    let _fType = t.tuple(t.ref(one), t.ref(two)), f;
    return c;
}
