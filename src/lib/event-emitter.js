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

const createNamespaceAPI = (namespace) => ({
  on: (action, handler) => eventEmitter.on(`${namespace}:${action}`, handler),
  off: (action, handler) => eventEmitter.off(`${namespace}:${action}`, handler),
  emit: (action, data) => eventEmitter.emit(`${namespace}:${action}`, data),
});

export const entity = createNamespaceAPI('entity');
export const workflow = createNamespaceAPI('workflow');
export const sync = createNamespaceAPI('sync');

export const onEntity = (action, handler) => entity.on(action, handler);
export const offEntity = (action, handler) => entity.off(action, handler);
export const emitEntity = (action, data) => entity.emit(action, data);

export const onWorkflow = (action, handler) => workflow.on(action, handler);
export const offWorkflow = (action, handler) => workflow.off(action, handler);
export const emitWorkflow = (action, data) => workflow.emit(action, data);

export const onSync = (entity, handler) => sync.on(entity, handler);
export const offSync = (entity, handler) => sync.off(entity, handler);
export const emitSync = (entity, data) => sync.emit(entity, data);
