export default () => {
  describe('Class Declaration', () => {
    it('should be annotated', () => {
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

    it('should not be annotated with noAnnotate', () => {
      const input = `class Foo { }`;

      const expected = `class Foo { }

      export {};`;

      const result = util.transform(input, { noAnnotate: true });

      util.compare(expected, result);
    });

    it('should support indexers', () => {
      const input = `
      class Foo {
        [index: string]: any;
      }`;

      const expected = `
      import t from "ts-runtime/lib";
      let Foo = class Foo {
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.indexer("index", t.string(), t.any())))
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

    it('should transform implementing an interface with an existing constructor', () => {
      const input = `
      interface IFoo { }
      class Foo implements IFoo {
        constructor() { }
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      const IFoo = t.type("IFoo", t.object());
      let Foo = class Foo {
        constructor() {
          t.ref(IFoo).assert(this);
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.property("constructor", t.function(t.return(t.any())))))
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

    it('should transform computed property names', () => {
      const input = `
      class Foo {
        [Symbol.iterator]() {

        }
      }`;

      const expected = `
      import t from "ts-runtime/lib";
      let Foo = class Foo {
        [Symbol.iterator]() {
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.property(Symbol.iterator, t.function(t.return(t.any())))))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform abstract properties and methods', () => {
      const input = `
      abstract class Foo {
        abstract prop: string;
        abstract method(): void;
      }`;

      const expected = `
      import t from "ts-runtime/lib";
      let Foo = class Foo {
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.property("prop", t.string()), t.property("method", t.function(t.return(t.void())))))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform static computed property names', () => {
      const input = `
      class Foo {
        static [Symbol.iterator]() {

        }
      }`;

      const expected = `
      import t from "ts-runtime/lib";
      let Foo = class Foo {
        static [Symbol.iterator]() {
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.staticProperty(Symbol.iterator, t.function(t.return(t.any())))))
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
          return this._prop__prop;
        }
        set prop(prop) {
          let _propType = t.string();
          t.param("prop", _propType).assert(prop);
          this._prop__prop = prop;
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
          this._prop__prop = t.string().assert('bar');
        }
        get prop() {
          return this._prop__prop;
        }
        set prop(prop) {
          let _propType = t.string();
          t.param("prop", _propType).assert(prop);
          this._prop__prop = prop;
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.property("prop", t.string())))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform properties with initializers with an existing constructor', () => {
      const input = `
      class Foo {
        constructor() { }
        prop: string = 'bar';
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = class Foo {
        constructor() {
          this._prop__prop = t.string().assert('bar');
        }
        get prop() {
          return this._prop__prop;
        }
        set prop(prop) {
          let _propType = t.string();
          t.param("prop", _propType).assert(prop);
          this._prop__prop = prop;
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.property("constructor", t.function(t.return(t.any()))), t.property("prop", t.string())))
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
          return this._prop__prop;
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
          this._prop__prop = t.string().assert('bar');
        }
        get prop() {
          return this._prop__prop;
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.property("prop", t.string())))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform readonly properties with initializers with an existing constructor', () => {
      const input = `
      class Foo {
        constructor() { }
        readonly prop: string = 'bar';
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      let Foo = class Foo {
        constructor() {
          this._prop__prop = t.string().assert('bar');
        }
        get prop() {
          return this._prop__prop;
        }
      };
      Foo = __decorate([
        t.annotate(t.class("Foo", t.property("constructor", t.function(t.return(t.any()))), t.property("prop", t.string())))
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
      var Foo_1;
      import t from "ts-runtime/lib";

      let Foo = Foo_1 = class Foo {
        static get prop() {
          return Foo_1._prop__prop;
        }
        static set prop(prop) {
          let _propType = t.string();
          t.param("prop", _propType).assert(prop);
          Foo_1._prop__prop = prop;
        }
      };
      Foo = Foo_1 = __decorate([
        t.annotate(t.class("Foo", t.staticProperty("prop", t.string())))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform static properties with initializers', () => {
      const input = `
      class Foo {
        static prop: string = 'bar';
      }`;

      const expected = `
      var Foo_1;
      import t from "ts-runtime/lib";

      let Foo = Foo_1 = class Foo {
        static get prop() {
          return Foo_1._prop__prop;
        }
        static set prop(prop) {
          let _propType = t.string();
          t.param("prop", _propType).assert(prop);
          Foo_1._prop__prop = prop;
        }
      };
      Foo._prop__prop = t.string().assert('bar');
      Foo = Foo_1 = __decorate([
        t.annotate(t.class("Foo", t.staticProperty("prop", t.string())))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform static readonly properties', () => {
      const input = `
      class Foo {
        static readonly prop: string;
      }`;

      const expected = `
      var Foo_1;
      import t from "ts-runtime/lib";

      let Foo = Foo_1 = class Foo {
        static get prop() {
          return Foo_1._prop__prop;
        }
      };
      Foo = Foo_1 = __decorate([
        t.annotate(t.class("Foo", t.staticProperty("prop", t.string())))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform static readonly properties with initializers', () => {
      const input = `
      class Foo {
        static readonly prop: string = 'bar';
      }`;

      const expected = `
      var Foo_1;
      import t from "ts-runtime/lib";

      let Foo = Foo_1 = class Foo {
        static get prop() {
          return Foo_1._prop__prop;
        }
      };
      Foo._prop__prop = t.string().assert('bar');
      Foo = Foo_1 = __decorate([
        t.annotate(t.class("Foo", t.staticProperty("prop", t.string())))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform class type parameters', () => {
      const input = `class Foo<T> { }`;

      const expected = `
      var _a;
      import t from "ts-runtime/lib";

      const _FooTypeParametersSymbol = Symbol("FooTypeParameters");
      let Foo = class Foo {
          constructor() {
              const _typeParameters = {
                  T: t.typeParameter("T")
              };
              this[_FooTypeParametersSymbol] = _typeParameters;
          }
      };
      _a = t.TypeParametersSymbol;
      Foo[_a] = _FooTypeParametersSymbol;
      Foo = __decorate([
          t.annotate(t.class("Foo", Foo => {
              const T = Foo.typeParameter("T");
              return [];
          }))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform class type parameters with an existing constructor', () => {
      const input = `
      class Foo<T> {
        constructor() { }
      }`;

      const expected = `
      var _a;
      import t from "ts-runtime/lib";

      const _FooTypeParametersSymbol = Symbol("FooTypeParameters");
      let Foo = class Foo {
          constructor() {
              const _typeParameters = {
                  T: t.typeParameter("T")
              };
              this[_FooTypeParametersSymbol] = _typeParameters;
          }
      };
      _a = t.TypeParametersSymbol;
      Foo[_a] = _FooTypeParametersSymbol;
      Foo = __decorate([
          t.annotate(t.class("Foo", Foo => {
              const T = Foo.typeParameter("T");
              return [t.property("constructor", t.function(t.return(t.any())))];
          }))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform class type parameters extending a type', () => {
      const input = `class Foo<T extends boolean> { }`;

      const expected = `
      var _a;
      import t from "ts-runtime/lib";

      const _FooTypeParametersSymbol = Symbol("FooTypeParameters");
      let Foo = class Foo {
          constructor() {
              const _typeParameters = {
                  T: t.typeParameter("T", t.boolean())
              };
              this[_FooTypeParametersSymbol] = _typeParameters;
          }
      };
      _a = t.TypeParametersSymbol;
      Foo[_a] = _FooTypeParametersSymbol;
      Foo = __decorate([
          t.annotate(t.class("Foo", Foo => {
              const T = Foo.typeParameter("T", t.boolean());
              return [];
          }))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform class type parameters extending a type with an existing constructor', () => {
      const input = `
      class Foo<T extends boolean> {
        constructor() { }
      }`;

      const expected = `
      var _a;
      import t from "ts-runtime/lib";

      const _FooTypeParametersSymbol = Symbol("FooTypeParameters");
      let Foo = class Foo {
          constructor() {
              const _typeParameters = {
                  T: t.typeParameter("T", t.boolean())
              };
              this[_FooTypeParametersSymbol] = _typeParameters;
          }
      };
      _a = t.TypeParametersSymbol;
      Foo[_a] = _FooTypeParametersSymbol;
      Foo = __decorate([
          t.annotate(t.class("Foo", Foo => {
              const T = Foo.typeParameter("T", t.boolean());
              return [t.property("constructor", t.function(t.return(t.any())))];
          }))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform class type parameters with a default value', () => {
      const input = `class Foo<T = true> { }`;

      const expected = `
      var _a;
      import t from "ts-runtime/lib";

      const _FooTypeParametersSymbol = Symbol("FooTypeParameters");
      let Foo = class Foo {
          constructor() {
              const _typeParameters = {
                  T: t.typeParameter("T", void 0, t.boolean(true))
              };
              this[_FooTypeParametersSymbol] = _typeParameters;
          }
      };
      _a = t.TypeParametersSymbol;
      Foo[_a] = _FooTypeParametersSymbol;
      Foo = __decorate([
          t.annotate(t.class("Foo", Foo => {
              const T = Foo.typeParameter("T", void 0, t.boolean(true));
              return [];
          }))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform class type parameters with a default value with an existing constructor', () => {
      const input = `
      class Foo<T = true> {
        constructor() { }
      }`;

      const expected = `
      var _a;
      import t from "ts-runtime/lib";

      const _FooTypeParametersSymbol = Symbol("FooTypeParameters");
      let Foo = class Foo {
          constructor() {
              const _typeParameters = {
                  T: t.typeParameter("T", void 0, t.boolean(true))
              };
              this[_FooTypeParametersSymbol] = _typeParameters;
          }
      };
      _a = t.TypeParametersSymbol;
      Foo[_a] = _FooTypeParametersSymbol;
      Foo = __decorate([
          t.annotate(t.class("Foo", Foo => {
              const T = Foo.typeParameter("T", void 0, t.boolean(true));
              return [t.property("constructor", t.function(t.return(t.any())))];
          }))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform class type parameters extending a type with a default value', () => {
      const input = `class Foo<T extends boolean = true> { }`;

      const expected = `
      var _a;
      import t from "ts-runtime/lib";

      const _FooTypeParametersSymbol = Symbol("FooTypeParameters");
      let Foo = class Foo {
          constructor() {
              const _typeParameters = {
                  T: t.typeParameter("T", t.boolean(), t.boolean(true))
              };
              this[_FooTypeParametersSymbol] = _typeParameters;
          }
      };
      _a = t.TypeParametersSymbol;
      Foo[_a] = _FooTypeParametersSymbol;
      Foo = __decorate([
          t.annotate(t.class("Foo", Foo => {
              const T = Foo.typeParameter("T", t.boolean(), t.boolean(true));
              return [];
          }))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform class type parameters extending a type with a default value with an existing constructor', () => {
      const input = `
      class Foo<T extends boolean = true> {
        constructor() { }
      }`;

      const expected = `
      var _a;
      import t from "ts-runtime/lib";

      const _FooTypeParametersSymbol = Symbol("FooTypeParameters");
      let Foo = class Foo {
          constructor() {
              const _typeParameters = {
                  T: t.typeParameter("T", t.boolean(), t.boolean(true))
              };
              this[_FooTypeParametersSymbol] = _typeParameters;
          }
      };
      _a = t.TypeParametersSymbol;
      Foo[_a] = _FooTypeParametersSymbol;
      Foo = __decorate([
          t.annotate(t.class("Foo", Foo => {
              const T = Foo.typeParameter("T", t.boolean(), t.boolean(true));
              return [t.property("constructor", t.function(t.return(t.any())))];
          }))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform the usage of class type parameters', () => {
      const input = `
      class Foo<T> {
        prop: T;
        method(param: T): T {
          return param;
        }
      }`;

      const expected = `
      var _a;
      import t from "ts-runtime/lib";

      const _FooTypeParametersSymbol = Symbol("FooTypeParameters");
      let Foo = class Foo {
          constructor() {
              const _typeParameters = {
                  T: t.typeParameter("T")
              };
              this[_FooTypeParametersSymbol] = _typeParameters;
          }
          get prop() {
              return this._prop__prop;
          }
          set prop(prop) {
              let _propType = this[_FooTypeParametersSymbol].T;
              t.param("prop", _propType).assert(prop);
              this._prop__prop = prop;
          }
          method(param) {
              let _paramType = this[_FooTypeParametersSymbol].T;
              const _returnType = t.return(this[_FooTypeParametersSymbol].T);
              t.param("param", _paramType).assert(param);
              return _returnType.assert(param);
          }
      };
      _a = t.TypeParametersSymbol;
      Foo[_a] = _FooTypeParametersSymbol;
      Foo = __decorate([
          t.annotate(t.class("Foo", Foo => {
              const T = Foo.typeParameter("T");
              return [t.property("prop", T), t.property("method", t.function(t.param("param", T), t.return(T)))];
          }))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should transform the usage of class type parameters with an existing constructor', () => {
      const input = `
      class Foo<T> {
        constructor() { }
        prop: T;
        method(param: T): T {
          return param;
        }
      }`;

      const expected = `
      var _a;
      import t from "ts-runtime/lib";

      const _FooTypeParametersSymbol = Symbol("FooTypeParameters");
      let Foo = class Foo {
          constructor() {
              const _typeParameters = {
                  T: t.typeParameter("T")
              };
              this[_FooTypeParametersSymbol] = _typeParameters;
          }
          get prop() {
              return this._prop__prop;
          }
          set prop(prop) {
              let _propType = this[_FooTypeParametersSymbol].T;
              t.param("prop", _propType).assert(prop);
              this._prop__prop = prop;
          }
          method(param) {
              let _paramType = this[_FooTypeParametersSymbol].T;
              const _returnType = t.return(this[_FooTypeParametersSymbol].T);
              t.param("param", _paramType).assert(param);
              return _returnType.assert(param);
          }
      };
      _a = t.TypeParametersSymbol;
      Foo[_a] = _FooTypeParametersSymbol;
      Foo = __decorate([
          t.annotate(t.class("Foo", Foo => {
              const T = Foo.typeParameter("T");
              return [t.property("constructor", t.function(t.return(t.any()))), t.property("prop", T), t.property("method", t.function(t.param("param", T), t.return(T)))];
          }))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should bind type parameters when extending a class', () => {
      const input = `
      class Bar<T> { }
      class Foo extends Bar<string> { }`;

      const expected = `
      var _a;
      import t from "ts-runtime/lib";

      const _BarTypeParametersSymbol = Symbol("BarTypeParameters");
      let Bar = class Bar {
          constructor() {
              const _typeParameters = {
                  T: t.typeParameter("T")
              };
              this[_BarTypeParametersSymbol] = _typeParameters;
          }
      };
      _a = t.TypeParametersSymbol;
      Bar[_a] = _BarTypeParametersSymbol;
      Bar = __decorate([
          t.annotate(t.class("Bar", Bar => {
              const T = Bar.typeParameter("T");
              return [];
          }))
      ], Bar);
      let Foo = class Foo extends Bar {
          constructor(...args) {
              super(...args);
              t.bindTypeParameters(this, t.string());
          }
      };
      Foo = __decorate([
          t.annotate(t.class("Foo", t.extends(t.ref(Bar, t.string()))))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should bind type parameters when extending a class with an existing constructor', () => {
      const input = `
      class Bar<T> {
        constructor() { }
      }
      class Foo extends Bar<string> {
        constructor() {
          super();
        }
      }`;

      const expected = `
      var _a;
      import t from "ts-runtime/lib";

      const _BarTypeParametersSymbol = Symbol("BarTypeParameters");
      let Bar = class Bar {
          constructor() {
              const _typeParameters = {
                  T: t.typeParameter("T")
              };
              this[_BarTypeParametersSymbol] = _typeParameters;
          }
      };
      _a = t.TypeParametersSymbol;
      Bar[_a] = _BarTypeParametersSymbol;
      Bar = __decorate([
          t.annotate(t.class("Bar", Bar => {
              const T = Bar.typeParameter("T");
              return [t.property("constructor", t.function(t.return(t.any())))];
          }))
      ], Bar);
      let Foo = class Foo extends Bar {
          constructor() {
              super();
              t.bindTypeParameters(this, t.string());
          }
      };
      Foo = __decorate([
          t.annotate(t.class("Foo", t.extends(t.ref(Bar, t.string())), t.property("constructor", t.function(t.return(t.any())))))
      ], Foo);`;

      const result = util.transform(input);

      util.compare(expected, result);
    });
  });
}
