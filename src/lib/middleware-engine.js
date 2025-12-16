export class MiddlewareEngine {
  constructor() {
    this.hooks = new Map();
    this.handlers = new Map();
  }

  register(entity, action, phase, callback) {
    const key = `${entity}:${action}:${phase}`;
    if (!this.hooks.has(key)) this.hooks.set(key, []);
    this.hooks.get(key).push(callback);
  }

  registerHandler(entity, action, callback) {
    const key = `${entity}:${action}`;
    this.handlers.set(key, callback);
  }

  async execute(entity, action, phase, context) {
    const key = `${entity}:${action}:${phase}`;
    const hooks = this.hooks.get(key) || [];
    for (const hook of hooks) {
      context = await hook(context);
    }
    return context;
  }

  async handle(entity, action, context) {
    context = await this.execute(entity, action, 'before', context);
    const handler = this.handlers.get(`${entity}:${action}`);
    if (handler) {
      context.result = await handler(context);
    }
    context = await this.execute(entity, action, 'after', context);
    return context.result;
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
