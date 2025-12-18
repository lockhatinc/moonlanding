export class HookRegistry {
  constructor() {
    this.hooks = new Map();
    this.maxListeners = 10;
  }

  makeKey(name, phase = null) {
    return phase ? `${name}:${phase}` : name;
  }

  register(name, callback, options = {}) {
    const { priority = 0, plugin = 'core', phase = null, once = false } = options;
    const key = this.makeKey(name, phase);

    if (!this.hooks.has(key)) {
      this.hooks.set(key, []);
    }

    const hook = { callback, priority, plugin, name, phase, once };
    const list = this.hooks.get(key);
    list.push(hook);
    list.sort((a, b) => b.priority - a.priority);

    if (list.length >= this.maxListeners) {
      console.warn(`[HookRegistry] MaxListenersExceeded: "${key}" has ${list.length} listeners`);
    }

    return this;
  }

  unregister(name, callback, phase = null) {
    const key = this.makeKey(name, phase);
    if (!this.hooks.has(key)) return this;
    this.hooks.set(key, this.hooks.get(key).filter(h => h.callback !== callback));
    return this;
  }

  removeAll(name = null, phase = null) {
    if (name) {
      const key = this.makeKey(name, phase);
      this.hooks.delete(key);
    } else {
      this.hooks.clear();
    }
    return this;
  }

  removeByPlugin(plugin) {
    for (const [key, hooks] of this.hooks.entries()) {
      this.hooks.set(key, hooks.filter(h => h.plugin !== plugin));
    }
    return this;
  }

  get(name, phase = null) {
    const key = this.makeKey(name, phase);
    return this.hooks.has(key) ? Array.from(this.hooks.get(key)) : [];
  }

  count(name, phase = null) {
    const key = this.makeKey(name, phase);
    return this.hooks.has(key) ? this.hooks.get(key).length : 0;
  }

  names() {
    return Array.from(this.hooks.keys());
  }

  setMaxListeners(n) {
    this.maxListeners = n;
    return this;
  }
}
