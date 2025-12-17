export class HookEngine {
  constructor() {
    this.hooks = new Map();
    this.handlers = new Map();
    this.plugins = new Map();
    this.maxListeners = 10;
    this.history = [];
  }

  register(name, callback, options = {}) {
    const { priority = 0, plugin = 'core', phase = null } = options;
    const key = phase ? `${name}:${phase}` : name;

    if (!this.hooks.has(key)) {
      this.hooks.set(key, []);
    }

    const hook = { callback, priority, plugin, name, phase, once: options.once };
    const hooks = this.hooks.get(key);
    hooks.push(hook);
    hooks.sort((a, b) => b.priority - a.priority);

    if (hooks.length >= this.maxListeners) {
      console.warn(`[HookEngine] MaxListenersExceeded: "${key}" has ${hooks.length} listeners`);
    }

    return this;
  }

  on(name, callback, options = {}) {
    return this.register(name, callback, options);
  }

  once(name, callback, options = {}) {
    return this.register(name, callback, { ...options, once: true });
  }

  registerHandler(name, callback) {
    this.handlers.set(name, callback);
    return this;
  }

  getHandler(name) {
    return this.handlers.get(name);
  }

  unregister(name, callback, phase = null) {
    const key = phase ? `${name}:${phase}` : name;
    if (!this.hooks.has(key)) return this;

    this.hooks.set(key, this.hooks.get(key).filter(h => h.callback !== callback));
    return this;
  }

  off(name, callback) {
    return this.unregister(name, callback);
  }

  removeAllHooks(name = null, phase = null) {
    if (name) {
      const key = phase ? `${name}:${phase}` : name;
      this.hooks.delete(key);
    } else {
      this.hooks.clear();
    }
    return this;
  }

  registerPlugin(name, definition = {}) {
    if (this.plugins.has(name)) {
      console.warn(`[HookEngine] Plugin "${name}" already registered, overwriting`);
    }

    const plugin = { name, ...definition };
    this.plugins.set(name, plugin);

    if (definition.hooks) {
      Object.entries(definition.hooks).forEach(([hookName, callback]) => {
        this.register(hookName, callback, { plugin: name, priority: definition.priority || 0 });
      });
    }

    if (definition.handlers) {
      Object.entries(definition.handlers).forEach(([handlerName, callback]) => {
        this.registerHandler(handlerName, callback);
      });
    }

    if (definition.middleware) {
      Object.entries(definition.middleware).forEach(([mwName, callback]) => {
        this.register(mwName, callback, { plugin: name, phase: 'middleware' });
      });
    }

    return this;
  }

  unregisterPlugin(name) {
    if (this.plugins.has(name)) {
      this.plugins.delete(name);
      for (const [key, hooks] of this.hooks.entries()) {
        this.hooks.set(key, hooks.filter(h => h.plugin !== name));
      }
    }
    return this;
  }

  getPlugin(name) {
    return this.plugins.get(name);
  }

  listPlugins() {
    return Array.from(this.plugins.values()).map(p => ({ name: p.name }));
  }

  async execute(name, data = {}, options = {}) {
    const { phase = null, serial = false, fallthrough = true, context = {} } = options;
    const key = phase ? `${name}:${phase}` : name;

    this._recordEvent(key, data);

    if (!this.hooks.has(key)) {
      return { success: true, data, context };
    }

    const hooks = Array.from(this.hooks.get(key));
    let result = data;
    let errors = [];

    for (const hook of hooks) {
      try {
        if (serial) {
          result = await hook.callback(result, context);
        } else {
          await hook.callback(result, context);
        }

        if (hook.once) {
          this.unregister(name, hook.callback, phase);
        }
      } catch (error) {
        console.error(`[HookEngine] Hook "${key}" error:`, error.message);
        errors.push(error);
        if (!fallthrough) throw error;
      }
    }

    return { success: errors.length === 0, data: serial ? result : data, errors, context };
  }

  async executeSerial(name, data = {}, options = {}) {
    return this.execute(name, data, { ...options, serial: true });
  }

  async executePhases(name, data, phases = ['before', 'handle', 'after'], context = {}) {
    let result = data;

    for (const phase of phases) {
      if (phase === 'handle') {
        const handler = this.getHandler(name);
        if (handler) {
          try {
            result = await handler(result, context);
          } catch (error) {
            console.error(`[HookEngine] Handler "${name}" error:`, error.message);
            throw error;
          }
        }
      } else {
        const res = await this.executeSerial(name, result, { phase, context, fallthrough: phase !== 'after' });
        result = res.data;
        if (!res.success && phase !== 'after') throw new Error(`Phase "${phase}" failed`);
      }
    }

    return result;
  }

  async transition(name, fromState, toState, data, context = {}) {
    const transitionKey = `${name}.${toState}`;

    const guards = this.hooks.get(`${transitionKey}:guard`) || [];
    for (const guard of guards) {
      try {
        const result = await guard.callback(data, context);
        if (!result) {
          throw new Error(`Guard failed for transition to "${toState}"`);
        }
      } catch (error) {
        console.error(`[HookEngine] Guard "${transitionKey}" failed:`, error.message);
        throw error;
      }
    }

    const res = await this.executeSerial(name, { ...data, toState }, {
      phase: 'before',
      context: { ...context, transition: transitionKey }
    });

    const result = { ...res.data, stage: toState };

    await this.executeSerial(name, result, {
      phase: 'after',
      context: { ...context, transition: transitionKey }
    });

    return result;
  }

  listenerCount(name, phase = null) {
    const key = phase ? `${name}:${phase}` : name;
    return this.hooks.has(key) ? this.hooks.get(key).length : 0;
  }

  listeners(name, phase = null) {
    const key = phase ? `${name}:${phase}` : name;
    return this.hooks.has(key) ? Array.from(this.hooks.get(key)) : [];
  }

  hookNames() {
    return Array.from(this.hooks.keys());
  }

  _recordEvent(name, data) {
    this.history.push({
      timestamp: Date.now(),
      hook: name,
      data: typeof data === 'object' ? { ...data } : data,
    });

    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  getHistory(name = null) {
    if (name) {
      return this.history.filter(h => h.hook === name);
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

  createPluginAPI() {
    return {
      register: this.register.bind(this),
      on: this.on.bind(this),
      registerHandler: this.registerHandler.bind(this),
      execute: this.execute.bind(this),
      executeSerial: this.executeSerial.bind(this),
      executePhases: this.executePhases.bind(this),
      getPlugin: this.getPlugin.bind(this),
    };
  }
}

export const hookEngine = new HookEngine();
