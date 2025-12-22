export class CacheStrategy {
  constructor(options = {}) {
    this.ttl = options.ttl || 5 * 60 * 1000;
    this.maxSize = options.maxSize || 100;
    this.cache = new Map();
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now(), ttl: this.ttl });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  invalidateAll() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export class LRUCache extends CacheStrategy {
  constructor(options = {}) {
    super(options);
    this.accessOrder = [];
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }
    if (this.cache.size >= this.maxSize) {
      const lruKey = this.accessOrder.shift();
      this.cache.delete(lruKey);
    }
    this.cache.set(key, { value, timestamp: Date.now(), ttl: this.ttl });
    this.accessOrder.push(key);
  }

  get(key) {
    const value = super.get(key);
    if (value !== null && this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
    }
    return value;
  }
}

export class TTLCache extends CacheStrategy {
  constructor(options = {}) {
    super(options);
    this.cleanupInterval = options.cleanupInterval || 60 * 1000;
    this.startCleanup();
  }

  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, this.cleanupInterval);
  }

  destroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }
}

export class NoCache {
  get() { return null; }
  set() { }
  has() { return false; }
  invalidate() { }
  invalidateAll() { }
  size() { return 0; }
}

export function createCacheStrategy(type = 'lru', options = {}) {
  const strategies = {
    lru: () => new LRUCache(options),
    ttl: () => new TTLCache(options),
    basic: () => new CacheStrategy(options),
    none: () => new NoCache(),
  };

  const factory = strategies[type] || strategies.lru;
  return factory();
}
