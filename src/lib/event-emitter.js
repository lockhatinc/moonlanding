class EventEmitter {
  constructor() {
    this.events = new Map();
    this.maxListeners = 10;
    this.history = [];
    this.maxHistory = 100;
  }

  on(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event);
    if (listeners.length >= this.maxListeners) {
      console.warn(
        `[EventEmitter] MaxListenersExceeded: ${event} has ${listeners.length} listeners`
      );
    }

    listeners.push(listener);
    return this;
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  off(event, listener) {
    if (!this.events.has(event)) {
      return this;
    }

    const listeners = this.events.get(event);
    const index = listeners.indexOf(listener);

    if (index !== -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.events.delete(event);
    }

    return this;
  }

  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  async emit(event, ...args) {
    this.recordEvent(event, args);

    if (!this.events.has(event)) {
      return false;
    }

    const listeners = Array.from(this.events.get(event));
    let error = null;

    for (const listener of listeners) {
      try {
        await listener(...args);
      } catch (e) {
        console.error(`[EventEmitter] Error in listener for "${event}":`, e);
        error = e;
      }
    }

    if (error) throw error;
    return listeners.length > 0;
  }

  async emitSerial(event, initialValue = null) {
    this.recordEvent(event, [initialValue]);

    if (!this.events.has(event)) {
      return initialValue;
    }

    const listeners = Array.from(this.events.get(event));
    let result = initialValue;

    for (const listener of listeners) {
      try {
        result = await listener(result);
      } catch (e) {
        console.error(`[EventEmitter] Error in serial listener for "${event}":`, e);
        throw e;
      }
    }

    return result;
  }

  listenerCount(event) {
    if (!this.events.has(event)) {
      return 0;
    }
    return this.events.get(event).length;
  }

  listeners(event) {
    if (!this.events.has(event)) {
      return [];
    }
    return Array.from(this.events.get(event));
  }

  eventNames() {
    return Array.from(this.events.keys());
  }

  recordEvent(event, args) {
    this.history.push({
      timestamp: Date.now(),
      event,
      args: args.slice(0, 2),
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getHistory(event = null) {
    if (event) {
      return this.history.filter((h) => h.event === event);
    }
    return Array.from(this.history);
  }

  clearHistory() {
    this.history = [];
    return this;
  }

  setMaxListeners(n) {
    this.maxListeners = n;
    return this;
  }

  setMaxHistory(n) {
    this.maxHistory = n;
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
