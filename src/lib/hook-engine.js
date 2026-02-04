export class HookEngine {
  constructor() {
    this.hooks = new Map();
  }

  register(name, callback, options = {}) {
    const { priority = 0, once = false } = options;
    if (!this.hooks.has(name)) this.hooks.set(name, []);
    const list = this.hooks.get(name);
    list.push({ callback, priority, once });
    list.sort((a, b) => b.priority - a.priority);
    return this;
  }

  on(name, callback, options = {}) {
    return this.register(name, callback, options);
  }

  async execute(name, data = {}, options = {}) {
    const { fallthrough = true } = options;
    const hooks = this.hooks.get(name);
    if (!hooks || hooks.length === 0) return { success: true, data };
    const errors = [];
    for (const hook of hooks) {
      try {
        await hook.callback(data);
        if (hook.once) {
          const idx = hooks.indexOf(hook);
          if (idx !== -1) hooks.splice(idx, 1);
        }
      } catch (error) {
        console.error(`[HookEngine] Hook "${name}" error:`, error.message);
        errors.push(error);
        if (!fallthrough) throw error;
      }
    }
    return { success: errors.length === 0, data, errors };
  }

  listeners(name) {
    return this.hooks.has(name) ? Array.from(this.hooks.get(name)) : [];
  }
}

export const hookEngine = new HookEngine();

export async function executeHook(name, data = {}, options = {}) {
  return hookEngine.execute(name, data, options);
}
