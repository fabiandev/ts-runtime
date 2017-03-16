import { Test } from './test';
function a(param1: string, param2?: Test[]) {
    let _param1Type = t.string(), _param2Type = t.array(t.ref(Test));
    t.param("param1", _param1Type, false).assert(param1);
    t.param("param2", _param2Type, true).assert(param2);
    let _somethingType = t.boolean(), something = _somethingType.assert(getNumber());
}
