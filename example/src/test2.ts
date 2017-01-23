/* tslint:disable */
export interface CanSpeak {
  firstname: string;
}

interface CanWalk {
  theName: string;
}

class Human {

}

function something(hi: string, two: boolean) {

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

let p: Person | Test = new Person();
let t = new Test();

p = new Person();

/* tslint:enable */
