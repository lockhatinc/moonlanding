export class HookRegistry {
  constructor() {
    this.hooks = new Map();
    this.plugins = new Map();
  }

  register(hookName, callback, priority = 10) {
    if (!this.hooks.has(hookName)) this.hooks.set(hookName, []);
    this.hooks.get(hookName).push({ callback, priority });
    this.hooks.get(hookName).sort((a, b) => b.priority - a.priority);
  }

  registerPlugin(name, plugin) {
    this.plugins.set(name, plugin);
  }

  async execute(hookName, context = {}) {
    const hooks = this.hooks.get(hookName) || [];
    for (const { callback } of hooks) {
      context = await callback(context);
    }
    return context;
  }

  async executePlugin(pluginName, action, context = {}) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) throw new Error(`Unknown plugin: ${pluginName}`);
    if (typeof plugin[action] === 'function') {
      return await plugin[action](context);
    }
    return context;
  }

  getPlugin(name) {
    return this.plugins.get(name);
  }

  getHooks(hookName) {
    return this.hooks.get(hookName) || [];
  }
}

export const registry = new HookRegistry();

export function registerHook(hookName, callback, priority = 10) {
  registry.register(hookName, callback, priority);
}

export function registerPlugin(name, plugin) {
  registry.registerPlugin(name, plugin);
}

export async function executeHook(hookName, context) {
  return registry.execute(hookName, context);
}

export async function executePluginAction(pluginName, action, context) {
  return registry.executePlugin(pluginName, action, context);
}
