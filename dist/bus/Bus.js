"use strict";
const EventEmitter = require("events");
class EventBus extends EventEmitter {
}
exports.EventBus = EventBus;
exports.bus = new EventBus();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.bus;
