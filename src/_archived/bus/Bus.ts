import * as EventEmitter from 'events';

export class EventBus extends EventEmitter {

}

export const bus = new EventBus();
export default bus;
