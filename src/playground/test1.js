function test(param1: string, param2?: boolean[]): [number, string] {
    let _param1Type = t.string(), _param2Type = t.array(t.boolean());
    const _returnType = t.return(t.tuple(t.number(), t.string()));
    t.param("param1", _param1Type, false).assert(param1);
    t.param("param2", _param2Type, true).assert(param2);
    let _anotherType = t.number(), another;
    const num = t.number().assert(10);
    let _strType = t.string(), str = _strType.assert('hi');
    let x = 10;
    return [num, str];
}
t.annotate(test, t.function(t.param("param1", t.string()), t.param("param2", t.array(t.boolean())), t.return(t.tuple(t.number(), t.string()))));
