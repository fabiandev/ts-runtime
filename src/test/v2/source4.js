const a = t.string().assert(10);
let _bType = t.array(t.number()), b;
b = [a];
function testFunction(t) {
    return 'Hello ' + t.name;
}
console.log(testFunction({ name: 'Alice' }));
