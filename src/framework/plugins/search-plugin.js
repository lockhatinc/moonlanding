import { BaseService } from '../base-plugin';

export class SearchPlugin extends BaseService {
  constructor() {
    super('search', '1.0.0');
    this.strategies = new Map();
    this.indexes = new Map();
    this.metadata = {
      description: 'Pluggable search strategies and indexing',
      dependencies: [],
      category: 'search',
    };
  }

  registerStrategy(name, strategy) {
    this.strategies.set(name, strategy);
    return this;
  }

  getStrategy(name) {
    return this.strategies.get(name) || this.strategies.get('default');
  }

  indexEntity(entity, data) {
    if (!this.indexes.has(entity)) {
      this.indexes.set(entity, []);
    }
    const idx = this.indexes.get(entity);
    idx.push(data);
    if (idx.length > 10000) {
      idx.shift();
    }
    this.stats.calls++;
    return this;
  }

  search(query, entity = null, options = {}) {
    const strategy = this.getStrategy(options.strategy || 'default');
    if (!strategy) {
      console.warn('[SearchPlugin] No search strategy available');
      return [];
    }
    try {
      const data = entity ? (this.indexes.get(entity) || []) : Array.from(this.indexes.values()).flat();
      return strategy(query, data, options);
    } catch (error) {
      console.error('[SearchPlugin] Search error:', error);
      this.stats.errors++;
      return [];
    }
  }

  clearIndex(entity = null) {
    if (entity) {
      this.indexes.delete(entity);
    } else {
      this.indexes.clear();
    }
    return this;
  }

  getIndexStats() {
    const stats = {};
    for (const [entity, data] of this.indexes) {
      stats[entity] = data.length;
    }
    return stats;
  }

  listStrategies() {
    return Array.from(this.strategies.keys());
  }
}
