class PluginSystem {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.middleware = new Map();
    this.eventHandlers = new Map();
  }

  register(name, plugin) {
    if (this.plugins.has(name)) {
      console.warn(`[PluginSystem] Plugin "${name}" already registered, overwriting`);
    }

    this.plugins.set(name, {
      name,
      ...plugin,
      hooks: plugin.hooks || {},
      middleware: plugin.middleware || {},
      handlers: plugin.handlers || {},
    });

    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([hookName, callback]) => {
        this.registerHook(hookName, 0, callback);
      });
    }

    if (plugin.middleware) {
      Object.entries(plugin.middleware).forEach(([mwName, mwFn]) => {
        this.registerMiddleware(mwName, mwFn);
      });
    }

    if (plugin.handlers) {
      Object.entries(plugin.handlers).forEach(([eventName, handler]) => {
        this.on(eventName, handler);
      });
    }

    return this;
  }

  unregister(name) {
    if (this.plugins.has(name)) {
      this.plugins.delete(name);
      for (const [hookName, callbacks] of this.hooks.entries()) {
        this.hooks.set(
          hookName,
          callbacks.filter((cb) => cb.plugin !== name)
        );
      }
    }
    return this;
  }

  getPlugin(name) {
    return this.plugins.get(name);
  }

  listPlugins() {
    return Array.from(this.plugins.values()).map((p) => ({ name: p.name }));
  }

  registerHook(name, priority = 0, callback, pluginName = 'core') {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }

    const hook = { callback, priority, plugin: pluginName };
    const hooks = this.hooks.get(name);
    hooks.push(hook);
    hooks.sort((a, b) => b.priority - a.priority);

    return this;
  }

  unregisterHook(name, pluginName) {
    if (this.hooks.has(name)) {
      this.hooks.set(
        name,
        this.hooks.get(name).filter((h) => h.plugin !== pluginName)
      );
    }
    return this;
  }

  async executeHook(name, context = {}) {
    if (!this.hooks.has(name)) {
      return context;
    }

    const hooks = this.hooks.get(name);
    let result = context;

    for (const { callback } of hooks) {
      try {
        result = await callback(result);
      } catch (e) {
        console.error(`[PluginSystem] Hook "${name}" failed:`, e);
        throw e;
      }
    }

    return result;
  }

  async executeHookSafe(name, context = {}) {
    try {
      return await this.executeHook(name, context);
    } catch (e) {
      console.error(`[PluginSystem] Hook "${name}" error (caught):`, e);
      return context;
    }
  }

  registerMiddleware(name, middleware) {
    this.middleware.set(name, middleware);
    return this;
  }

  getMiddleware(name) {
    return this.middleware.get(name);
  }

  async applyMiddleware(name, context = {}) {
    const mw = this.getMiddleware(name);
    if (!mw) {
      console.warn(`[PluginSystem] Middleware "${name}" not found`);
      return context;
    }

    try {
      return await mw(context);
    } catch (e) {
      console.error(`[PluginSystem] Middleware "${name}" failed:`, e);
      throw e;
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
    return this;
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.set(
        event,
        this.eventHandlers.get(event).filter((h) => h !== handler)
      );
    }
    return this;
  }

  async emit(event, ...args) {
    if (!this.eventHandlers.has(event)) {
      return;
    }

    const handlers = this.eventHandlers.get(event);
    for (const handler of handlers) {
      try {
        await handler(...args);
      } catch (e) {
        console.error(`[PluginSystem] Event handler for "${event}" failed:`, e);
      }
    }
  }

  async emitSerial(event, ...args) {
    if (!this.eventHandlers.has(event)) {
      return;
    }

    const handlers = this.eventHandlers.get(event);
    let result = args[0];

    for (const handler of handlers) {
      try {
        result = await handler(result, ...args.slice(1));
      } catch (e) {
        console.error(`[PluginSystem] Event handler for "${event}" failed:`, e);
        throw e;
      }
    }

    return result;
  }

  createPluginAPI() {
    return {
      registerHook: this.registerHook.bind(this),
      registerMiddleware: this.registerMiddleware.bind(this),
      on: this.on.bind(this),
      emit: this.emit.bind(this),
      getPlugin: this.getPlugin.bind(this),
      executeHook: this.executeHook.bind(this),
    };
  }
}

export const pluginSystem = new PluginSystem();

export function createPlugin(name, definition) {
  return {
    name,
    ...definition,
  };
}

export async function loadPlugin(name, definition) {
  pluginSystem.register(name, definition);
  console.log(`[PluginSystem] Loaded plugin: ${name}`);
}

export async function loadPlugins(plugins) {
  for (const [name, definition] of Object.entries(plugins)) {
    await loadPlugin(name, definition);
  }
}
