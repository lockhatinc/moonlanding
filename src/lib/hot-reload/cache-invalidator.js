const path = require('path');

class CacheInvalidator {
  constructor() {
    this.invalidated = new Set();
    this.watchers = new Map();
  }

  invalidate(modulePath) {
    const resolved = require.resolve(modulePath);

    if (require.cache[resolved]) {
      this._invalidateModule(resolved);
      this.invalidated.add(resolved);
      return true;
    }

    return false;
  }

  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const modulePath of Object.keys(require.cache)) {
      if (regex.test(modulePath)) {
        this._invalidateModule(modulePath);
        this.invalidated.add(modulePath);
        count++;
      }
    }

    return count;
  }

  invalidateAll(excludePattern = /node_modules/) {
    let count = 0;

    for (const modulePath of Object.keys(require.cache)) {
      if (excludePattern && excludePattern.test(modulePath)) {
        continue;
      }

      this._invalidateModule(modulePath);
      this.invalidated.add(modulePath);
      count++;
    }

    return count;
  }

  _invalidateModule(modulePath) {
    const module = require.cache[modulePath];
    if (!module) return;

    if (module.parent) {
      const index = module.parent.children.indexOf(module);
      if (index !== -1) {
        module.parent.children.splice(index, 1);
      }
    }

    for (const child of module.children || []) {
      this._invalidateModule(child.id);
    }

    delete require.cache[modulePath];
  }

  reload(modulePath) {
    this.invalidate(modulePath);
    return require(modulePath);
  }

  getStats() {
    return {
      totalCached: Object.keys(require.cache).length,
      invalidated: this.invalidated.size,
      watchers: this.watchers.size
    };
  }

  clearStats() {
    this.invalidated.clear();
  }
}

const globalInvalidator = new CacheInvalidator();

module.exports = { CacheInvalidator, globalInvalidator };
