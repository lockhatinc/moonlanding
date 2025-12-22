export class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
  }

  register(name, instance) {
    if (typeof instance === 'function') {
      this.factories.set(name, instance);
      return this;
    }
    this.services.set(name, instance);
    return this;
  }

  registerFactory(name, factory) {
    this.factories.set(name, factory);
    return this;
  }

  get(name) {
    if (this.services.has(name)) {
      return this.services.get(name);
    }
    if (this.factories.has(name)) {
      const instance = this.factories.get(name)();
      this.services.set(name, instance);
      return instance;
    }
    throw new Error(`Service '${name}' not found in container`);
  }

  has(name) {
    return this.services.has(name) || this.factories.has(name);
  }

  clear() {
    this.services.clear();
    this.factories.clear();
    return this;
  }

  remove(name) {
    this.services.delete(name);
    this.factories.delete(name);
    return this;
  }

  entries() {
    const result = new Map();
    for (const [name] of this.services) result.set(name, this.services.get(name));
    for (const [name] of this.factories) {
      if (!result.has(name)) result.set(name, `[Factory: ${name}]`);
    }
    return result;
  }
}

export const globalContainer = new ServiceContainer();
