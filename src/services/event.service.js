class EventService {
  constructor() {
    this.channels = new Map();
  }

  broadcast(entity, action, data, options = {}) {
    const key = `${entity}:${action}`;
    if (!this.channels.has(key)) {
      this.channels.set(key, []);
    }
    const callbacks = this.channels.get(key);
    callbacks.forEach(cb => {
      try {
        cb({ entity, action, data, timestamp: Date.now(), ...options });
      } catch (err) {
        console.error(`[EVENT] Broadcast error for ${key}:`, err);
      }
    });
  }

  broadcastEntityChange(entityName, id, action, data) {
    this.broadcast(entityName, action, { id, ...data });
  }

  subscribe(entity, action, callback) {
    const key = `${entity}:${action}`;
    if (!this.channels.has(key)) {
      this.channels.set(key, []);
    }
    this.channels.get(key).push(callback);

    return () => {
      const callbacks = this.channels.get(key);
      const idx = callbacks.indexOf(callback);
      if (idx > -1) callbacks.splice(idx, 1);
    };
  }

  unsubscribe(entity, action, callback) {
    const key = `${entity}:${action}`;
    const callbacks = this.channels.get(key);
    if (!callbacks) return;
    const idx = callbacks.indexOf(callback);
    if (idx > -1) callbacks.splice(idx, 1);
  }

  onEntityCreate(entity, callback) {
    return this.subscribe(entity, 'create', callback);
  }

  onEntityUpdate(entity, callback) {
    return this.subscribe(entity, 'update', callback);
  }

  onEntityDelete(entity, callback) {
    return this.subscribe(entity, 'delete', callback);
  }

  emitLifecycleEvent(spec, event, context) {
    this.broadcast(spec.name, `lifecycle:${event}`, { ...context });
  }

  clear(entity, action) {
    const key = `${entity}:${action}`;
    this.channels.delete(key);
  }

  clearAll() {
    this.channels.clear();
  }
}

export const eventService = new EventService();
