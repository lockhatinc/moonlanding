export class FieldMetadataCache {
  constructor(options = {}) {
    this.ttl = options.ttl || 60 * 60 * 1000;
    this.cache = new Map();
    this.indexes = new Map();
  }

  set(entityType, fieldKey, metadata) {
    const cacheKey = `${entityType}:${fieldKey}`;
    this.cache.set(cacheKey, {
      metadata,
      timestamp: Date.now(),
      ttl: this.ttl,
    });

    this.updateIndex(entityType, fieldKey);
  }

  get(entityType, fieldKey) {
    const cacheKey = `${entityType}:${fieldKey}`;
    const entry = this.cache.get(cacheKey);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.metadata;
  }

  getAll(entityType) {
    const fields = new Map();
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(`${entityType}:`)) {
        const fieldKey = key.split(':')[1];
        if (Date.now() - entry.timestamp <= entry.ttl) {
          fields.set(fieldKey, entry.metadata);
        } else {
          this.cache.delete(key);
        }
      }
    }
    return fields;
  }

  updateIndex(entityType, fieldKey) {
    if (!this.indexes.has(entityType)) {
      this.indexes.set(entityType, new Set());
    }
    this.indexes.get(entityType).add(fieldKey);
  }

  getFieldKeys(entityType) {
    const keys = this.indexes.get(entityType);
    if (!keys) return [];
    return Array.from(keys);
  }

  invalidate(entityType, fieldKey = null) {
    if (fieldKey) {
      const cacheKey = `${entityType}:${fieldKey}`;
      this.cache.delete(cacheKey);
    } else {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${entityType}:`)) {
          this.cache.delete(key);
        }
      }
      this.indexes.delete(entityType);
    }
  }

  invalidateAll() {
    this.cache.clear();
    this.indexes.clear();
  }

  size() {
    return this.cache.size;
  }

  stats() {
    return {
      totalEntries: this.cache.size,
      entityTypes: this.indexes.size,
      entities: Array.from(this.indexes.entries()).map(([type, keys]) => ({
        type,
        fieldCount: keys.size,
      })),
    };
  }
}

export const fieldMetadataCache = new FieldMetadataCache();

export function cacheFieldMetadata(entityType, spec) {
  if (!spec || !spec.fields) return;

  for (const field of spec.fields) {
    fieldMetadataCache.set(entityType, field.key, {
      label: field.label,
      type: field.type,
      required: field.required,
      readonly: field.readonly,
      options: field.options,
      ref: field.ref,
      validation: field.validation,
      display: field.display,
    });
  }
}

export function getFieldMetadata(entityType, fieldKey) {
  return fieldMetadataCache.get(entityType, fieldKey);
}

export function getEntityFieldMetadata(entityType) {
  return fieldMetadataCache.getAll(entityType);
}
