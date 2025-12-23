import { HookRegistry } from './hook-registry.js';

export class BasePlugin {
  constructor(name, version = '1.0.0') {
    this.name = name;
    this.version = version;
    this.enabled = true;
    this.config = {};
    this.hookRegistry = new HookRegistry();
    this.metadata = {
      author: 'Framework',
      description: '',
      dependencies: [],
    };
  }

  register(hook, handler, priority = 10) {
    this.hookRegistry.register(hook, handler, priority);
    return this;
  }

  getHooks(hook) {
    return this.hookRegistry.getHandlers(hook);
  }

  configure(config) {
    this.config = { ...this.config, ...config };
    return this;
  }

  enable() {
    this.enabled = true;
    return this;
  }

  disable() {
    this.enabled = false;
    return this;
  }

  isEnabled() {
    return this.enabled;
  }

  onInit() {}
  onEnable() {}
  onDisable() {}
  onUninstall() {}
}

export class BaseService extends BasePlugin {
  constructor(name, version = '1.0.0') {
    super(name, version);
    this.cache = new Map();
    this.stats = { calls: 0, errors: 0, duration: 0 };
  }

  cacheGet(key) {
    return this.cache.get(key);
  }

  cacheSet(key, value, ttl = null) {
    this.cache.set(key, value);
    if (ttl) {
      setTimeout(() => this.cache.delete(key), ttl);
    }
    return this;
  }

  cacheClear() {
    this.cache.clear();
    return this;
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = { calls: 0, errors: 0, duration: 0 };
    return this;
  }
}

export class BaseEngine extends BasePlugin {
  constructor(name, version = '1.0.0') {
    super(name, version);
    this.pipeline = [];
    this.middleware = [];
  }

  use(middleware) {
    this.middleware.push(middleware);
    return this;
  }

  pipe(step) {
    this.pipeline.push(step);
    return this;
  }

  clearPipeline() {
    this.pipeline = [];
    return this;
  }

  async execute(input, context = {}) {
    let output = input;
    for (const middleware of this.middleware) {
      output = await middleware(output, context);
    }
    for (const step of this.pipeline) {
      output = await step(output, context);
    }
    return output;
  }
}
