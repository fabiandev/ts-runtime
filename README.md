# ts-runtime

A package for generating runtime type checks from TypeScript type annotations for JavaScript, using the TypeScript compiler API.

## Quick Start

```sh
$ yarn global add ts-runtime
$ tsr --help
```

> You can also use `npm -g install ts-runtime`.

## Credits

Type reflections and assertions for the runtime environment are being made possible by [flow-runtime](https://github.com/codemix/flow-runtime), a runtime type system for JavaScript.

## Transformations

Most of explicit type annotations will be reflected (and checked) at runtime. Checks for implicitly inferred types may be added in a future release. In the following section the most important cases are documented.

### Source File

On top of every source file, the library is imported to enable type checks at runtime.

```ts
import t from 'ts-runtime/lib';
```

### Variables

We will distinguish between `var` and `let` declarations and `const` declarations and assume, that the latter will never be reassigned during runtime.

#### Reassignable Declarations

A variable declaration that may be reassigned at runtime as the following:

```ts
let num: number;
num = "Hello World!";
```

will be reflected and checked as shown below:

```js
let _numType = t.number(), num;
num = _numType.assert("Hello World!")
```

#### Constant Declarations

A constant declaration does only need to be checked when declared, and no additional variable, holding the variable's type, has to be introduced.

```ts
const num: number = "Hello World!";
```

The const declaration from above, results in:

```js
const num = t.number().assert("Hello World!");
```

### Assertions

In TypeScript the above assignments would already be flagged by the compiler. By using the `as any` type assertion, any assignment will be allowed but still caught at runtime. Therefore other than `any` assertions will be checked.

```ts
true as any as number;
```

The above assertion may not be a real world example, but there are situations where similar things happen. Imagine calling a function, that returns `any`. While *you know* that the returned value will be a number, you also want the TypeScript compiler to be aware of it and you assert it as a number. Probably this function call is from an external library and a bug is introduced that a boolean value is returned, which will remain unnoticed until checked at runtime.

```js
t.number().assert(true);
```

### Functions

Function parameters and it's return value will be checked as well, and functions will be annotate to extract it's type reflection at runtime.

#### Function Declarations

This function simply creates a number from a string.

```ts
function getNumberFromString(str: string): number {
  return Number(str);
}
```

The code below is the result, with runtime type checks inserted.

```js
function getNumberFromString(str) {
  let _strType = t.string();
  const _returnType = t.return(t.number());
  t.param("str", _strType).assert(str);
  return _returnType.assert(Number(str));
}
```

By default the function is also annotated, to get the type reflection of the object at runtime:

```js
t.annotate(getNumberFromString, t.function(t.param("str", t.string()), t.return(t.number())));
```

> Annotations can be turned off, by setting the `annotate` option to `false` or using the `--noAnnotate` flag with the CLI.

#### Function Expressions

Also function expressions will be transformed:

```ts
const getNumberFromString = function(str: string): number {
  return Number(str);
}
```

This declaration will be converted to:

```js
const getNumberFromString = function (str) {
  let _strType = t.string();
  const _returnType = t.return(t.number());
  t.param("str", _strType).assert(str);
  return _returnType.assert(Number(str));
};
```

Again, by default the function is annotated like so:

```js
const getNumberFromString = t.annotate(function (str) {
  // function body
}, t.function(t.param("str", t.string()), t.return(t.number())));
```

#### Arrow Functions

Arrow function are also supported, with a similar result to function expressions. If runtime checks have to be inserted into an arrow function without a body, ts-runtime generates it for you:

```ts
const getNumberFromString = (str: string): number => Number(str);
```

This one-liner is great, but in order to assert the values it is transformed to the following:

```js
const getNumberFromString = (str) => {
  let _strType = t.string();
  const _returnType = t.return(t.number());
  t.param("str", _strType).assert(str);
  return _returnType.assert(Number(str));
};
```

Of course also the arrow function are annotated by default:

```js
const getNumberFromString = t.annotate((str) => {
  // arrow function body
}, t.function(t.param("str", t.string()), t.return(t.number())));
```

### Type Queries

In the following example, TypeScript gets the type of a variable and uses it as type for another variable declaration.

```ts
let num = 10;
let numType: typeof num = "Hello World!";
```

In ts-runtime this will be transformed to:

```js
let num = 10;
let _myNumType = t.typeOf(num), myNum = _myNumType.assert("Hello World!");
```

> Please note, that `num` is not reflected and asserted, because it lacks an explicit type annotation.

### Enums

Please mote that currently the TypeScript compiler option `preserveConstEnums` will be always set to `true` by ts-runtime. A warning will in your console will let you know.

#### Enum Declarations

The following enum:

```ts
enum Action {
  None,
  Save,
  Update
}
```

will be transformed to the following by TypeScript:

```js
var Action;
(function (Action) {
  Action[Action["None"] = 0] = "None";
  Action[Action["Save"] = 1] = "Save";
  Action[Action["Update"] = 2] = "Update";
})(Action || (Action = {}));
```

and annotated by ts-runtime with the reflection below:

```ts
t.annotate(Action, t.enum(t.enumMember(0), t.enumMember(1), t.enumMember(2)));
```

#### Enum References

Using the enum as type reference will be reflected and only the numbers `0`, `1`, and `2` can be assigned to `action`:

```ts
let action: Action;
```

```js
let _actionType = t.enumRef(Action), action;
```

The same is true when using a specific enum members as reference. In this example only the number `1` can be assigned to `saveAction`:

```ts
let saveAction: Action.Save;
```
```js
let _saveActionType = t.enumMember(Action.Save), saveAction;
```

### Type Aliases

Type aliases usually are removed entirely by the TypeScript compiler.

```ts
type MyType = {
  property: string;
  optional?: number;
  method: (param: boolean) => void;
}
```

The type alias declaratin from above will be replaced with the following reflection:

```js
const MyType = t.type("MyType", t.object(
  t.property("property", t.string()),
  t.property("optional", t.number(), true),
  t.property("method", t.function(t.param("param", t.boolean()), t.return(t.void())))
));
```

> Self references are supported.

### Interfaces

Also iterfaces would be compiled away.

```ts
interface BaseInterface {
  [index: string]: any;
}

interface MyInterface extends BaseInterface {
  prop: string;
}
```

With ts-runtime they will be replaced with a reflection:

```js
const BaseInterface = t.type("BaseInterface", t.object(
  t.indexer("index", t.string(), t.any()))
);

const MyInterface = t.type("MyInterface", t.intersect(t.ref(BaseInterface), t.object(
  t.property("prop", t.string())
)));
```

### Classes

Classes are also transformed with support for properties, static properties, static and non-static methods, deriving from other classes, implementing interfaces, as well as method overloading, which will be covered later.

```ts
class MyClass {
  method(param?: number): void {

  }
}
```

At this point, only a very minimal class transformation, with a single method, is shown:

```js
class MyClass {
  method(param: number) {
    let _paramType = t.number();
    const _returnType = t.return(t.void());
    t.param("param", _paramType, true).assert(param);
  }
}
```

By default also classes are annotated:

```js
@t.annotate(t.class("MyClass", 
  t.property("method", t.function(t.param("param", t.number(), true), t.return(t.void())))
))
class MyClass {
  // class body
}
```

### Overloading

Method overloading is supported for type aliases, interfaces and classes, and generates union types based on the overloads.

```ts
class MyInterface {
  method(param: number): string;
  method(param: boolean): string;
  method(param: any): any {
    // implementation
  }
}
```

While all overloads are considered, when generating a reflection, the implementation is ignored:

```js
@t.annotate(t.class("MyInterface",
  t.property("method", t.function(
    t.param("param", t.union(t.number(), t.boolean())), t.return(t.string()))
  )
))
class MyInterface {
  method(param: number): string;
  method(param: boolean): string;
  method(param: any): any {
    // implementation
  }
}

```

### Generics

Generics are supported for functions, classes, interfaces and type aliases.

```ts
function asArray<T>(val: T): T[] {
  return [val];
}
```

The above snipped shows a simple function, that wraps the passed parameter in an array, using generics, which results in the following transformation:

```js
function asArray(val) {
  const T = t.typeParameter("T");
  let _valType = t.flowInto(T);
  const _returnType = t.return(t.array(T));
  t.param("val", _valType).assert(val);
  return _returnType.assert([val]);
}
```

### Externals and Ambient Declarations

We were seeing a couple of different transformations based on local variables. What about external packages, declaration files and ambient declarations? They are collected and emitted to a single file.

#### Externals

Imagine the following type reference:

```ts
import * as ts from 'typescript';
let flowNode: ts.FlowNode;
```

It points to the interface `FlowNode`, inside the `typescript.d.ts` file, that looks like this:

```ts
interface FlowNode {
  flags: FlowFlags;
  id?: number;
}
```

Because we can't modify the code of externals, and definition files won't be included anyway, the reference is removed and replaced by a string. this string holds the fully qualified name of the reference, and the hashed file name as a suffix, to prevent naming clashes:

```js
let _flowNodeType = t.ref("ts.FlowNode.82613696"), flowNode;
```

The actual reflections go into a single file (`tsr-declaration.js` by default), which has to be loaded before any other code and looks like this for the declaration from above:

```js
t.declare(t.type("ts.FlowFlags.82613696", t.enum(/* enum members */)));
t.declare(t.type("ts.FlowNode.82613696", t.object(/* properties */)));
```

#### Declarations

Also local declarations, as shown below, will be included in `tsr-declarations.js`

```ts
declare module MyModule {
  class MyClass {

  }
}
```

and results in the following globally declared reflection:

```js
t.declare(t.class("MyModule.MyClass.3446180452", t.object()));
```

> The generated file will be located at the common directory of entry files or in the root of `outDir` or `outFile`. For some controls regarding this file, have a look at the options later in this readme.

## Limitations

- Only `as number` syntax for type assertions (no angle-bracket `<number>`).
- No mapped types reflection yet.
- readonly or class visibility modifiers are not asserted.
- No declaration merging.
- Method overloading only within same declaration.
- No class expressions (`const A = class { };`), only class declarations (`class A { }`).
- `ExpressionWithTypeArguments` can only contain `PropertyAccessExpressions` and `Identifiers`

## Options

##### annotate
Type: `boolean`  
Default: true  

Specifies if classes and function should be annotate with a reflection.

##### compilerOptions
Type: `ts.CompilerOptions`  
Default:  
```js
{
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  module: ts.ModuleKind.ES2015,
  target: ts.ScriptTarget.ES2015,
  lib: ["lib.es2015.d.ts"],
  strictNullChecks: true,
  experimentalDecorators: true,
  sourceMap: false,
  removeComments: true,
  preserveConstEnums: true,
}
```

> The option preserveConstEnum will always be set to true by ts-runtime.

##### declarationFileName
Type: `string`  
Default: "tsr-declarations"  

The file name where all external and ambient declarations will be written to. Excludes a path or an extension.

##### importDeclarations
Type: `boolean`  
Default: true  

Specifies if the generated file should be imported on top of every entry file.

##### force
Type: `boolean`  
Default: false  

Try to continue if TypeScript compiler diagnostics occured.

##### keepTemp
Type: `boolean`  
Default: false  

Do not delete temporary files on finish.

##### tempFolderName
Type: `string`  
Default: ".tsr"  

Name of the directory, where temporary files should be written to.

##### libNamespace
Type: `string`  
Default: "_"  

Prefix for the default library import.

##### libIdentifier
Type: `string`  
Default: "t"  

Identifier of the default library import, prefixed by its namespace.
Looks like the following by default

```ts
import _t from "ts-runtime/lib";
```

##### declarationPrefix
Type: `string`  
Default: "_"  

If new variables are introduced while transforming, they will be prefixed with this specified string.

##### moduleAlias
Type: `boolean`  
Default: false  

Adds `import "module-alias/register";` on top of every file.

##### stackTraceOutput
Type: `number`  
Default: 3  

Limit the output of the stack trace. This only takes effect via the CLI.

##### log
Type: `boolean`  
Default: true  

Log messages to the console. This option is not available via the CLI and will always be set to false.

## API

It is easy to make use of ts-runtime via Node. `entryFiles` is a `string[]` and an `options` object may optionally be passed as second parameter.

```ts
import { transform } from 'ts-runtime';
transform(entryFiles);
```

It is also possible to listen for various events:

```ts
import { transform, bus } from 'ts-runtime';

bus.on(bus.events.START, () => {
  // callback if processing is about to start
});

transform(entryFiles, { log: false });
```

## CLI

```
  Usage: tsr <file...> [options]

  ---------  ts-runtime  ---------
  Turns TypeScript type assertions
  into runtime type checks for you
  --------------------------------

  Options:

    -h, --help                               output usage information
    -v, --version                            output the version number
    -a, --noAnnotate                         do not annotate classes and functions
    -c, --compilerOptions <compilerOptions>  set TypeScript compiler options. defaults to {}
    -d, --declarationFileName <fileName>     set file name for global declarations. defaults to "tsr-declarations"
    -e, --excludeDeclarationFile             do not automatically import ambient declarations in the entry file. default to false
    -f, --force                              try to finish on TypeScript compiler error. defaults to false
    -k, --keepTemp                           keep temporary files. defaults to false
    -l, --libIdentifier <name>               lib import name. defaults to "t"
    -m, --moduleAlias                        import package module-alias on top of every file.
    -n, --libNamespace <namespace>           prefix for lib and code additions. defaults to "_"
    -p, --declarationPrefix <namespace>      prefix for added variables. defaults to "_"
    -s, --stackTraceOutput <limit>           output a specified number of lines of the stack trace. defaults to 3
    -t, --tempFolder <name>                  set folder name for temporary files. defaults to ".tsr"

  Examples:

    $ tsr entry.ts --force
    $ tsr src/bin/index.ts src/lib/index.ts
    $ tsr -c '{ "outDir": "dist" }' entry.ts
```

## Building

```sh
$ git checkout https://github.com/fabiandev/ts-runtime.git
$ cd ts-runtime
$ yarn build
```
