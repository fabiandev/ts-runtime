export default () => {
  describe('Arrow Function', () => {
    it('should be annotated', () => {
      const input = `() => void 0`;

      const expected = `
      import t from "ts-runtime/lib";

      t.annotate(() => {
        return void 0;
      }, t.function(
        t.return(t.any()))
      );`;

      const result = util.transform(input);

      util.compare(expected, result);
    });

    it('should not be annotated with noAnnotate', () => {
      const input = `() => void 0`;

      const expected = `
      () => {
        return void 0;
      };`;

      const result = util.transform(input, { noAnnotate: true });

      util.compare(expected, result);
    });

    it('should assert the return type', () => {
      const input = `(): string => "Foo"`;

      const expected = `
      import t from "ts-runtime/lib";

      () => {
        const _returnType = t.return(t.string());
        return _returnType.assert("Foo");
      };`;

      const result = util.transform(input, { noAnnotate: true });

      util.compare(expected, result);
    });

    it('should assert multiple returns', () => {
      const input = `
      (): string => {
        if (true === true) {
          return "Bar";
        }

        [1, 2, 3].map(val => {
          return 1;
        });

        return "Foo";
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      () => {
        const _returnType = t.return(t.string());

        if (true === true) {
            return _returnType.assert("Bar");
        }

        [1, 2, 3].map((val) => {
            return 1;
        });

        return _returnType.assert("Foo");
      };`;

      const result = util.transform(input, { noAnnotate: true });

      util.compare(expected, result);
    });

    it('should assert parameters', () => {
      const input = `(param1: boolean, param2: number): string => "Foo"`;

      const expected = `
      import t from "ts-runtime/lib";

      (param1, param2) => {
        let _param1Type = t.boolean();
        let _param2Type = t.number();
        const _returnType = t.return(t.string());
        t.param("param1", _param1Type).assert(param1);
        t.param("param2", _param2Type).assert(param2);
        return _returnType.assert("Foo");
      };`;

      const result = util.transform(input, { noAnnotate: true });

      util.compare(expected, result);
    });

    it('should assert optional parameters', () => {
      const input = `(param?: string) => void 0`;

      const expected = `
      import t from "ts-runtime/lib";

      (param) => {
        let _paramType = t.string();
        t.param("param", _paramType, true).assert(param);
        return void 0;
      };`;

      const result = util.transform(input, { noAnnotate: true });

      util.compare(expected, result);
    });

    it('should assert rest parameters', () => {
      const input = `(...params: string[]) => void 0`;

      const expected = `
      import t from "ts-runtime/lib";

      (...params) => {
        let _paramsType = t.array(t.string());
        t.rest("params", _paramsType).assert(params);
        return void 0;
      };`;

      const result = util.transform(input, { noAnnotate: true });

      util.compare(expected, result);
    });

    it('should assert type parameters', () => {
      const input = `
      <T>(param: T): T => {
          return param;
      }`;

      const expected = `
      import t from "ts-runtime/lib";

      (param) => {
        const T = t.typeParameter("T");
        let _paramType = t.flowInto(T);
        const _returnType = t.return(T);
        t.param("param", _paramType).assert(param);
        return _returnType.assert(param);
      };`;

      const result = util.transform(input, { noAnnotate: true });

      util.compare(expected, result);
    });
  });
}
