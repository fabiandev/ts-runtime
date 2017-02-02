# ts-runtime

Generate runtime type checks for JavaScript from TypeScript

> Note: This project is still in heavy development and not published yet.

## Installation

> [Node.js](https://nodejs.org) as well as [yarn](https://yarnpkg.com) or npm (comes with Node) needs to be installed on your system.

```
$ yarn global add typescript ts-node gulp gulp-cli
$ git clone https://github.com/fabiandev/ts-runtime.git
$ cd ts-runtime
$ cd node_modules/typescript
$ yarn && yarn build
$ tsc Gulpfile.ts
$ gulp
```

Now copy all files from `built/local/lib` to `lib/` by replacing existing.

```sh
$ yarn && yarn build
$ cd ../../
$ yarn link
$ tsr
```

> Now you can use `ts-runtime` via `tsr` in the command line.

## Usage

You can use the command line to process files:

```sh
$ tsr --help
$ tsr -w test.ts
```

Or use the package with Node:

```ts
import { transform, Writer } from 'ts-config';

transform('test.ts')
  .then(result => {
    const writer = new Writer(result);
    writer.writeAll();
  });
```

## Result

> The example below would compile without errors, as the TypeScript  
> compiler won't be able to detect that there may be conflicts.

The following source:

```ts
import { getNumber } from 'library'; 
import { Person } from './person';

function doSomething(name: string: persons?: Person[]): number {
  let something: boolean = getNumber();
  return parseInt(name);
}

```

Results in:

```js
import t from 'ts-runtime/lib';
import { getNumber } from 'library';
import { Person } from './person';

function doSomething(name: string, persons?: Person[]) {
    let _param1Type = t.string(), _param2Type = t.array(t.ref(Test));
    
    t.param("param1", _param1Type).assert(param1);
    t.param("param2", _param2Type, true).assert(param2);
    
    let _somethingType = t.boolean(), something = _somethingType.assert(getNumber());
    
    const _returnType = t.return(t.number());
    
    return _returnType.assert(parseInt(name));
}

```

## Add custom transformers

Adding custom transformers is simple:

```ts
import * as ts from 'typescript';
import { Transformer } from 'ts-runtime';

export class InterfaceDeclarationTransformer extends Transformer {

  protected substitution = ts.SyntaxKind.ts.SyntaxKind.InterfaceDeclaration;
  
  protected transform(node: ts.InterfaceDeclaration): ts.Node {
    // perform transformations
    return node;
  }
  
}
```
