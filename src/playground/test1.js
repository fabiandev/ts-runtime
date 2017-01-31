function test(param1: string, param2?: boolean[]): [number, string] {
    let _param1Type = t.string(), _param2Type = t.array(t.boolean());
    const _returnType = t.return(t.tuple(t.number(), t.string()));
    t.param("param1", _param1Type, false).assert(param1);
    t.param("param2", _param2Type, true).assert(param2);
    let another;
    const num = t.number().assert(10);
    let _strType = t.string(), str = _strType.assert('hi');
    var _bbType = t.ref(Object), bb = _bbType.assert({});
    let u; // use any type
    let _xType = t.any(), x = _xType.assert(10); // TODO: use implicit type
    const y = t.any().assert('hi');
    x = 1; // TODO: check reassignments
    return [num, str]; // TODO: check return value
}
t.annotate(test, t.function(t.param("param1", t.string()), t.param("param2", t.array(t.boolean())), t.return(t.tuple(t.number(), t.string()))));
let g;
let _eType = t.any(), e = _eType.assert(g = 10);
g = 'hi';
g = 10;
