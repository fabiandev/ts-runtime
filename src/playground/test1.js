function test(param1: string, param2?: boolean[]): [number, string] {
    let _param1Type = t.string(), _param2Type = t.array(t.boolean());
    t.param("param1", _param1Type, false).assert(param1);
    t.param("param2", _param2Type, true).assert(param2);
    const num = t.number().assert(10);
    let _strType = t.string(), str = _strType.assert('hi');
    return [num, str];
}
