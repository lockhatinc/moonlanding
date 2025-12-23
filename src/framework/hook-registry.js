export class HookRegistry {
  constructor() {
    this.hooks = new Map();
  }

  register(hookName, handler, priority = 10) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName).push({ handler, priority });
    this.hooks.get(hookName).sort((a, b) => b.priority - a.priority);
    return this;
  }

  getHandlers(hookName) {
    return (this.hooks.get(hookName) || []).map(h => h.handler);
  }

  async execute(hookName, data = {}) {
    const handlers = this.getHandlers(hookName);
    const results = [];
    for (const handler of handlers) {
      try {
        const result = await handler(data);
        results.push(result);
      } catch (error) {
        console.error(`[HookRegistry] Hook ${hookName} error:`, error);
      }
    }
    return results;
  }

  clear(hookName) {
    if (hookName) {
      this.hooks.delete(hookName);
    } else {
      this.hooks.clear();
    }
    return this;
  }

  has(hookName) {
    return this.hooks.has(hookName) && this.hooks.get(hookName).length > 0;
  }
}
