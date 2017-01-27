/* tslint:disable */
const _xType = t.number();
let x = _xType.assert(10);
const _yType = t.array(t.boolean());
let y;
x = 5;
x = 'str';
y = [];
y = [true, false, true];
y = [true, 'hi', false];
