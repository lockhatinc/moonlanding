export class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.listeners = new Map();
  }

  register(plugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }
    this.plugins.set(plugin.name, plugin);
    if (typeof plugin.onInit === 'function') {
      plugin.onInit();
    }
    this.emit('plugin:registered', { plugin });
    return this;
  }

  unregister(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin ${name} not found`);
    if (typeof plugin.onUninstall === 'function') {
      plugin.onUninstall();
    }
    this.plugins.delete(name);
    this.emit('plugin:unregistered', { name });
    return this;
  }

  enable(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin ${name} not found`);
    plugin.enable();
    if (typeof plugin.onEnable === 'function') {
      plugin.onEnable();
    }
    this.emit('plugin:enabled', { name });
    return this;
  }

  disable(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin ${name} not found`);
    plugin.disable();
    if (typeof plugin.onDisable === 'function') {
      plugin.onDisable();
    }
    this.emit('plugin:disabled', { name });
    return this;
  }

  get(name) {
    return this.plugins.get(name);
  }

  has(name) {
    return this.plugins.has(name);
  }

  list() {
    return Array.from(this.plugins.values());
  }

  listEnabled() {
    return this.list().filter(p => p.isEnabled());
  }

  hook(hookName, handler) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName).push(handler);
    return this;
  }

  async executeHook(hookName, data = {}) {
    const handlers = this.hooks.get(hookName) || [];
    const results = [];
    for (const handler of handlers) {
      try {
        const result = await handler(data);
        results.push(result);
      } catch (error) {
        console.error(`[PluginManager] Hook ${hookName} error:`, error);
      }
    }
    return results;
  }

  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
    return this;
  }

  off(event, listener) {
    if (!this.listeners.has(event)) return this;
    const handlers = this.listeners.get(event);
    const idx = handlers.indexOf(listener);
    if (idx > -1) handlers.splice(idx, 1);
    return this;
  }

  emit(event, data) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`[PluginManager] Event ${event} listener error:`, error);
      }
    });
    return this;
  }

  getMetrics() {
    return {
      totalPlugins: this.plugins.size,
      enabledPlugins: this.listEnabled().length,
      hooks: this.hooks.size,
      listeners: this.listeners.size,
    };
  }

  reset() {
    this.plugins.clear();
    this.hooks.clear();
    this.listeners.clear();
    return this;
  }
}

export const globalPluginManager = new PluginManager();
