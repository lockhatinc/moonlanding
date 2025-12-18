export class PluginRegistry {
  constructor(registry, executor) {
    this.registry = registry;
    this.executor = executor;
    this.plugins = new Map();
  }

  register(name, definition = {}) {
    if (this.plugins.has(name)) {
      console.warn(`[PluginRegistry] Plugin "${name}" already registered, overwriting`);
    }

    const plugin = { name, ...definition };
    this.plugins.set(name, plugin);

    if (definition.hooks) {
      Object.entries(definition.hooks).forEach(([hookName, callback]) => {
        this.registry.register(hookName, callback, { plugin: name, priority: definition.priority || 0 });
      });
    }

    if (definition.handlers) {
      Object.entries(definition.handlers).forEach(([handlerName, callback]) => {
        this.executor.registerHandler(handlerName, callback);
      });
    }

    if (definition.middleware) {
      Object.entries(definition.middleware).forEach(([mwName, callback]) => {
        this.registry.register(mwName, callback, { plugin: name, phase: 'middleware' });
      });
    }

    return this;
  }

  unregister(name) {
    if (this.plugins.has(name)) {
      this.plugins.delete(name);
      this.registry.removeByPlugin(name);
    }
    return this;
  }

  get(name) {
    return this.plugins.get(name);
  }

  list() {
    return Array.from(this.plugins.values()).map(p => ({ name: p.name }));
  }
}
