/* tslint:disable */
export interface CanSpeak {
  firstname: string;
}

interface CanWalk {
  theName: string;
}

class Human {

}

class Person extends Human implements CanSpeak, CanWalk {
	private _name: string;
  firstname = 'hi';
  theName = 'how';
  get name() {
    return this._name;
  }

}

class Test extends Person {

}

let p = new Person();
let t = new Test();
/* tslint:enable */
