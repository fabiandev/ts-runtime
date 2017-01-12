export interface CanSpeak {
  firstname: string;
}

interface CanWalk {
  string: theName;
}

class Human {

}

function returnString() {
  return 'str';
}

function returnBoolean() {
  return true;
}

class Person extends Human implements CanSpeak, CanWalk {
	private _name: string;

  get name() {
    return this._name;
  }

}

let p = new Person();

if (Person implements CanSpeak) {
  console.log('Person type implements CanSpeak');
}

if (p implements CanWalk) {
  console.log('Person instance implements CanWalk');
}
