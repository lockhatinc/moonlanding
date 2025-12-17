import { hookEngine } from './hook-engine.js';

class PluginSystem {
  constructor() {
    this.engine = hookEngine;
  }

  register(name, plugin) {
    return this.engine.registerPlugin(name, plugin);
  }

  unregister(name) {
    return this.engine.unregisterPlugin(name);
  }

  getPlugin(name) {
    return this.engine.getPlugin(name);
  }

  listPlugins() {
    return this.engine.listPlugins();
  }

  registerHook(name, priority = 0, callback, pluginName = 'core') {
    return this.engine.register(name, callback, { priority, plugin: pluginName });
  }

  unregisterHook(name, pluginName) {
    const hooks = this.engine.listeners(name);
    hooks.filter(h => h.plugin === pluginName).forEach(h => {
      this.engine.off(name, h.callback);
    });
    return this;
  }

  async executeHook(name, context = {}) {
    const result = await this.engine.executeSerial(name, context, { fallthrough: false });
    return result.data;
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
    return this.engine.register(name, middleware, { phase: 'middleware' });
  }

  getMiddleware(name) {
    const hooks = this.engine.listeners(name, 'middleware');
    return hooks.length > 0 ? hooks[0].callback : null;
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
    return this.engine.on(event, handler);
  }

  off(event, handler) {
    return this.engine.off(event, handler);
  }

  async emit(event, ...args) {
    const data = args.length === 1 ? args[0] : args;
    await this.engine.execute(event, data, { fallthrough: true });
  }

  async emitSerial(event, ...args) {
    const data = args.length === 1 ? args[0] : args;
    const result = await this.engine.executeSerial(event, data, { fallthrough: true });
    return result.data;
  }

  createPluginAPI() {
    return this.engine.createPluginAPI();
  }
}

export const pluginSystem = new PluginSystem();

export function createPlugin(name, definition) {
  return { name, ...definition };
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
