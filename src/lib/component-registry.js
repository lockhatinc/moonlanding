import { COMPONENT_REGISTRY as COMPONENT_LOADERS } from '@/config/component-paths';

class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.renders = new Map();
    this.loaders = COMPONENT_LOADERS;
  }

  register(entity, mode, component, priority = 0) {
    const key = `${entity}:${mode}`;

    if (!this.components.has(key)) {
      this.components.set(key, []);
    }

    const entry = {
      component,
      priority,
      entity,
      mode,
    };

    const components = this.components.get(key);
    components.push(entry);
    components.sort((a, b) => b.priority - a.priority);

    return this;
  }

  unregister(entity, mode, priority = 0) {
    const key = `${entity}:${mode}`;
    if (this.components.has(key)) {
      this.components.set(
        key,
        this.components.get(key).filter((c) => c.priority !== priority)
      );
    }
    return this;
  }

  get(entity, mode) {
    const key = `${entity}:${mode}`;
    const components = this.components.get(key);

    if (!components || components.length === 0) {
      console.warn(`[ComponentRegistry] No component found for ${entity}:${mode}`);
      return null;
    }

    return components[0].component;
  }

  getAll(entity, mode) {
    const key = `${entity}:${mode}`;
    const components = this.components.get(key);
    return components ? components.map((c) => c.component) : [];
  }

  has(entity, mode) {
    const key = `${entity}:${mode}`;
    return this.components.has(key) && this.components.get(key).length > 0;
  }

  list(entity = null) {
    if (!entity) {
      return Array.from(this.components.entries()).map(([key, components]) => {
        const [ent, mode] = key.split(':');
        return {
          entity: ent,
          mode,
          count: components.length,
          component: components[0].component,
        };
      });
    }

    const keys = Array.from(this.components.keys()).filter((k) =>
      k.startsWith(`${entity}:`)
    );

    return keys.map((key) => {
      const [ent, mode] = key.split(':');
      const components = this.components.get(key);
      return {
        entity: ent,
        mode,
        count: components.length,
        component: components[0].component,
      };
    });
  }

  registerRenderer(fieldType, mode, renderer) {
    const key = `renderer:${fieldType}:${mode}`;
    this.renders.set(key, renderer);
    return this;
  }

  getRenderer(fieldType, mode) {
    const key = `renderer:${fieldType}:${mode}`;
    return this.renders.get(key);
  }

  clear() {
    this.components.clear();
    this.renders.clear();
    return this;
  }

  clone() {
    const registry = new ComponentRegistry();
    registry.components = new Map(this.components);
    registry.renders = new Map(this.renders);
    return registry;
  }

  loadComponent(componentName) {
    return this.loaders[componentName] || null;
  }

  hasLoader(componentName) {
    return componentName in this.loaders;
  }

  listLoaders() {
    return Object.keys(this.loaders);
  }

  getComponentPath(componentName) {
    return this.loaders[componentName] || null;
  }
}

export const componentRegistry = new ComponentRegistry();

export function registerComponent(entity, mode, component, priority = 0) {
  componentRegistry.register(entity, mode, component, priority);
}

export function getComponent(entity, mode) {
  return componentRegistry.get(entity, mode);
}

export function hasComponent(entity, mode) {
  return componentRegistry.has(entity, mode);
}
