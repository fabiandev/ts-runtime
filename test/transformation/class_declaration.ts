export default () => {
  describe('Class Declaration', () => {
    it('should transform', () => {
      const input = `class Foo { }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = class Foo {
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.object()))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform extending another class', () => {
      const input = `
      class Bar { }
      class Foo extends Bar { }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Bar = class Bar {
      };
      Bar = __decorate([
        t.annotate(t.class("Bar", t.object()))
      ], Bar);
      let Foo = class Foo extends Bar {
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.extends(t.ref(Bar))))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform implementing an interface', () => {
      const input = `
      interface IFoo { }
      class Foo implements IFoo { }`;

      const expected = `
      import t from "ts-runtime/lib";

      const IFoo = t.type("IFoo", t.object());
      let Foo = class Foo {
        constructor() {
          t.ref(IFoo).assert(this);
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.object()))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform methods', () => {
      const input = `
      class Foo {
        method(prop: string): boolean {
          return true;
        }
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = class Foo {
        method(prop) {
          let _propType = t.string();
          const _returnType = t.return(t.boolean());
          t.param("prop", _propType).assert(prop);
          return _returnType.assert(true);
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.property("method", t.function(t.param("prop", t.string()), t.return(t.boolean())))))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform static methods', () => {
      const input = `
      class Foo {
        static method(prop: string): boolean {
          return true;
        }
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = class Foo {
        static method(prop) {
          let _propType = t.string();
          const _returnType = t.return(t.boolean());
          t.param("prop", _propType).assert(prop);
          return _returnType.assert(true);
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.staticProperty("method", t.function(t.param("prop", t.string()), t.return(t.boolean())))))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform properties', () => {
      const input = `
      class Foo {
        prop: string;
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = class Foo {
        get prop() {
          return this._prop;
        }
        set prop(prop) {
          let _propType = t.string();
          t.param("prop", _propType).assert(prop);
          this._prop = prop;
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.property("prop", t.string())))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform properties with initializers', () => {
      const input = `
      class Foo {
        prop: string = 'bar';
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = class Foo {
        constructor() {
          this._prop = t.string().assert('bar');
        }
        get prop() {
          return this._prop;
        }
        set prop(prop) {
          let _propType = t.string();
          t.param("prop", _propType).assert(prop);
          this._prop = prop;
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.property("prop", t.string())))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform readonly properties', () => {
      const input = `
      class Foo {
        readonly prop: string;
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = class Foo {
        get prop() {
          return this._prop;
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.property("prop", t.string())))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform readonly properties with initializers', () => {
      const input = `
      class Foo {
        readonly prop: string = 'bar';
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = class Foo {
        constructor() {
          this._prop = t.string().assert('bar');
        }
        get prop() {
          return this._prop;
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.property("prop", t.string())))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform static properties', () => {
      const input = `
      class Foo {
        static prop: string;
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = Foo_1 = class Foo {
        static get prop() {
          return Foo_1._prop;
        }
        static set prop(prop) {
          let _propType = t.string();
          t.param("prop", _propType).assert(prop);
          Foo_1._prop = prop;
        }
      };
      Foo = Foo_1 = __decorate([
        t.annotate(t.class("Foo", t.staticProperty("prop", t.string())))
      ], Foo);
      var Foo_1;`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform static properties with initializers', () => {
      const input = `
      class Foo {
        static prop: string = 'bar';
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = Foo_1 = class Foo {
        static get prop() {
          return Foo_1._prop;
        }
        static set prop(prop) {
          let _propType = t.string();
          t.param("prop", _propType).assert(prop);
          Foo_1._prop = prop;
        }
      };
      Foo._prop = t.string().assert('bar');
      Foo = Foo_1 = __decorate([
        t.annotate(t.class("Foo", t.staticProperty("prop", t.string())))
      ], Foo);
      var Foo_1;`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform static readonly properties', () => {
      const input = `
      class Foo {
        static readonly prop: string;
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = Foo_1 = class Foo {
        static get prop() {
          return Foo_1._prop;
        }
      };
      Foo = Foo_1 = __decorate([
        t.annotate(t.class("Foo", t.staticProperty("prop", t.string())))
      ], Foo);
      var Foo_1;`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform static readonly properties with initializers', () => {
      const input = `
      class Foo {
        static readonly prop: string = 'bar';
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = Foo_1 = class Foo {
        static get prop() {
          return Foo_1._prop;
        }
      };
      Foo._prop = t.string().assert('bar');
      Foo = Foo_1 = __decorate([
        t.annotate(t.class("Foo", t.staticProperty("prop", t.string())))
      ], Foo);
      var Foo_1;`;

      const result = util.transform(input);

      util.compare(expected, result);
    });
  });
}
