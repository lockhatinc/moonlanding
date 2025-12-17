import { hookEngine } from './hook-engine.js';

class EventEmitter {
  constructor() {
    this.engine = hookEngine;
  }

  on(event, listener) {
    if (typeof listener !== 'function') throw new TypeError('Listener must be a function');
    return this.engine.on(event, listener);
  }

  once(event, listener) {
    if (typeof listener !== 'function') throw new TypeError('Listener must be a function');
    return this.engine.once(event, listener);
  }

  off(event, listener) {
    return this.engine.off(event, listener);
  }

  removeAllListeners(event) {
    return this.engine.removeAllHooks(event);
  }

  async emit(event, ...args) {
    const data = args.length === 1 ? args[0] : args;
    const result = await this.engine.execute(event, data, { fallthrough: false });
    return result.success && this.engine.listenerCount(event) > 0;
  }

  async emitSerial(event, initialValue = null) {
    const result = await this.engine.executeSerial(event, initialValue, { fallthrough: false });
    return result.data;
  }

  listenerCount(event) {
    return this.engine.listenerCount(event);
  }

  listeners(event) {
    return this.engine.listeners(event).map(h => h.callback);
  }

  eventNames() {
    return this.engine.hookNames();
  }

  recordEvent(event, args) {
    this.engine._recordEvent(event, args);
  }

  getHistory(event = null) {
    return this.engine.getHistory(event);
  }

  clearHistory() {
    return this.engine.clearHistory();
  }

  setMaxListeners(n) {
    return this.engine.setMaxListeners(n);
  }

  setMaxHistory(n) {
    return this;
  }
}

export const eventEmitter = new EventEmitter();

export async function onEntity(action, handler) {
  const eventName = `entity:${action}`;
  eventEmitter.on(eventName, handler);
}

export async function offEntity(action, handler) {
  const eventName = `entity:${action}`;
  eventEmitter.off(eventName, handler);
}

export async function emitEntity(action, data) {
  const eventName = `entity:${action}`;
  return eventEmitter.emit(eventName, data);
}

export async function onWorkflow(action, handler) {
  const eventName = `workflow:${action}`;
  eventEmitter.on(eventName, handler);
}

export async function offWorkflow(action, handler) {
  const eventName = `workflow:${action}`;
  eventEmitter.off(eventName, handler);
}

export async function emitWorkflow(action, data) {
  const eventName = `workflow:${action}`;
  return eventEmitter.emit(eventName, data);
}

export async function onSync(entity, handler) {
  const eventName = `sync:${entity}`;
  eventEmitter.on(eventName, handler);
}

export async function offSync(entity, handler) {
  const eventName = `sync:${entity}`;
  eventEmitter.off(eventName, handler);
}

export async function emitSync(entity, data) {
  const eventName = `sync:${entity}`;
  return eventEmitter.emit(eventName, data);
}
