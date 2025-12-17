import { hookEngine } from './hook-engine.js';

export class MiddlewareEngine {
  constructor() {
    this.engine = hookEngine;
  }

  register(entity, action, phase, callback) {
    const name = `${entity}:${action}`;
    this.engine.register(name, callback, { phase });
  }

  registerHandler(entity, action, callback) {
    const name = `${entity}:${action}`;
    this.engine.registerHandler(name, callback);
  }

  async execute(entity, action, phase, context) {
    const name = `${entity}:${action}`;
    const result = await this.engine.executeSerial(name, context, { phase });
    return result.data;
  }

  async handle(entity, action, context) {
    const name = `${entity}:${action}`;
    return this.engine.executePhases(name, context, ['before', 'handle', 'after']);
  }
}

export const middleware = new MiddlewareEngine();

export function defineMiddleware(entity, config) {
  for (const [action, hooks] of Object.entries(config)) {
    if (hooks.before) {
      for (const hook of (Array.isArray(hooks.before) ? hooks.before : [hooks.before])) {
        middleware.register(entity, action, 'before', hook);
      }
    }
    if (hooks.after) {
      for (const hook of (Array.isArray(hooks.after) ? hooks.after : [hooks.after])) {
        middleware.register(entity, action, 'after', hook);
      }
    }
    if (hooks.handle) {
      middleware.registerHandler(entity, action, hooks.handle);
    }
  }
}

export function hook(entity, action, phase) {
  return (callback) => middleware.register(entity, action, phase, callback);
}

export function before(entity, action) {
  return hook(entity, action, 'before');
}

export function after(entity, action) {
  return hook(entity, action, 'after');
}

export function handler(entity, action) {
  return (callback) => middleware.registerHandler(entity, action, callback);
}
