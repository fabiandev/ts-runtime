import { a, TestInterface } from './source2';
import { bla } from './source3';
console.log(a);
console.log(bla);
console.log(TestInterface);
class Test implements TestInterface {
    public test(): string {
        let a = 'hi';
        return a;
    }
}
