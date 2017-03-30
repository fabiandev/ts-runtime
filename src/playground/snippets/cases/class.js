function num() { return 1; }
;
const X = t.type("X", t.nullable(t.object(t.property("g", t.nullable(t.string())))));
const Y = t.type("Y", t.nullable(t.object(t.property("imeth", t.nullable(t.function(t.return(t.any())))))));
class AbstractTest {
    constructor() {
        this.g = 'g';
    }
    imeth() {
    }
}
class BaseTest extends AbstractTest {
}
BaseTest.y = 'a';
class Test extends BaseTest {
    constructor() {
        super();
        this.d = ['str'];
    }
    static method(param1, param2) {
        return 0;
    }
    [CompProp.a]() {
    }
}
Test.a = num();
Test.b = 'str';
