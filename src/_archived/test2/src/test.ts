export interface CanSpeak {
  firstname: string;
}

interface CanWalk {
  string: theName;
}

class Human {

}

class Person extends Human implements CanSpeak, CanWalk {
	private _name: string;

  get name() {
    return this._name;
  }

}

class Test extends Person {

}

let p = new Person();
let t = new Test();

if (Person implements CanSpeak) {
  console.log('Person implements CanSpeak');
}

if (p implements CanWalk) {
  console.log('p implements CanWalk');
}

if (p instanceof Human) {
  console.log('p instanceof Human');
}

if (Test implements CanSpeak) {
  console.log('Test implements CanSpeak');
}

if (t implements CanWalk) {
  console.log('t implements CanWalk');
}
