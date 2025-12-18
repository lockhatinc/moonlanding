export class DataCache {
  constructor() {
    this.cache = new Map();
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.cache.clear();
  }

  key(entity, id = null, options = {}) {
    if (id) return `${entity}:${id}`;
    const sortKey = options.sort ? `${options.sort.field}:${options.sort.dir}` : '';
    const queryKey = options.query || '';
    return `${entity}:list:${queryKey}:${sortKey}`;
  }

  get(entity, id = null, options = {}) {
    if (!this.enabled) return null;
    return this.cache.get(this.key(entity, id, options));
  }

  set(entity, data, id = null, options = {}) {
    if (!this.enabled) return;
    this.cache.set(this.key(entity, id, options), data);
  }

  clear(entity = null) {
    if (!this.enabled) return;
    if (entity) {
      for (const k of this.cache.keys()) {
        if (k.startsWith(`${entity}:`)) {
          this.cache.delete(k);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}
