type TestType = {
    name: string;
};
const a: string = t.string().assert(10);
let _bType = t.array(t.number()), b: number[];
b = [a];
function testFunction(t: TestType): string {
    return 'Hello ' + t.name;
}
console.log(testFunction({ name: 'Alice' }));
