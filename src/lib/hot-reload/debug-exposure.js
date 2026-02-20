export class DebugExposure {
  constructor() {
    this.exposed = new Map();
    if (typeof global !== 'undefined') {
      global.__debug = this;
    }
  }

  expose(key, value, description = '') {
    this.exposed.set(key, {
      value,
      description,
      exposedAt: new Date().toISOString()
    });
    if (typeof global !== 'undefined' && !global[key]) {
      global[key] = value;
    }
    return value;
  }

  get(key) {
    const entry = this.exposed.get(key);
    return entry ? entry.value : undefined;
  }

  list() {
    const list = [];
    for (const [key, entry] of this.exposed.entries()) {
      list.push({
        key,
        description: entry.description,
        exposedAt: entry.exposedAt,
        type: typeof entry.value
      });
    }
    return list;
  }

  inspect(key) {
    const entry = this.exposed.get(key);
    if (!entry) return null;
    const value = entry.value;
    const info = {
      key,
      description: entry.description,
      exposedAt: entry.exposedAt,
      type: typeof value,
      constructor: value?.constructor?.name
    };
    if (typeof value === 'object' && value !== null) {
      if (typeof value.getStats === 'function') info.stats = value.getStats();
      if (typeof value.getState === 'function') info.state = value.getState();
      info.keys = Object.keys(value);
    }
    return info;
  }

  remove(key) {
    this.exposed.delete(key);
    if (typeof global !== 'undefined' && global[key]) {
      delete global[key];
    }
  }

  clear() {
    for (const key of this.exposed.keys()) {
      this.remove(key);
    }
  }
}

export const globalDebug = new DebugExposure();
export const expose = globalDebug.expose.bind(globalDebug);
