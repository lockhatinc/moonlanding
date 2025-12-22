import { BaseService } from '../base-plugin';

export class FieldRendererPlugin extends BaseService {
  constructor() {
    super('field-renderer', '1.0.0');
    this.renderers = new Map();
    this.metadata = {
      description: 'Consolidated field rendering for forms, lists, and displays',
      dependencies: [],
      category: 'rendering',
    };
  }

  registerRenderer(fieldType, mode, renderer) {
    const key = `${fieldType}:${mode}`;
    this.renderers.set(key, renderer);
    this.stats.calls++;
    return this;
  }

  getRenderer(fieldType, mode) {
    const key = `${fieldType}:${mode}`;
    return this.renderers.get(key);
  }

  render(fieldType, mode, ...args) {
    const renderer = this.getRenderer(fieldType, mode);
    if (!renderer) {
      console.warn(`[FieldRendererPlugin] No renderer for ${fieldType}:${mode}`);
      return null;
    }
    try {
      return renderer(...args);
    } catch (error) {
      console.error(`[FieldRendererPlugin] Render error for ${fieldType}:${mode}:`, error);
      this.stats.errors++;
      return null;
    }
  }

  listRenderers() {
    return Array.from(this.renderers.keys());
  }

  listFieldTypes() {
    const types = new Set();
    for (const key of this.renderers.keys()) {
      const [type] = key.split(':');
      types.add(type);
    }
    return Array.from(types);
  }

  listModes() {
    const modes = new Set();
    for (const key of this.renderers.keys()) {
      const [, mode] = key.split(':');
      modes.add(mode);
    }
    return Array.from(modes);
  }
}
