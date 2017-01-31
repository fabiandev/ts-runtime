class A {
}
function f(param1: boolean, param2?: string[]): string {
    let _param1Type = t.boolean(), _param2Type = t.array(t.string());
    const _returnType = t.return(t.string());
    t.param("param1", _param1Type, false).assert(param1);
    t.param("param2", _param2Type, true).assert(param2);
    let _xType = t.ref(ComplexType), x = _xType.assert(() => {
        const a = t.boolean().assert(true);
        return a;
    });
    const b = t.number().assert(10);
    let c;
    let _dType = t.array(t.boolean()), d = _dType.assert([true, false]);
    const e = t.array(t.array(t.array(t.number()))).assert([[[10]]]);
    c = 'hi';
    let f;
    return c;
}
