export class HookHistory {
  constructor() {
    this.history = [];
    this.maxSize = 100;
  }

  record(name, data) {
    this.history.push({
      timestamp: Date.now(),
      hook: name,
      data: typeof data === 'object' ? { ...data } : data,
    });

    if (this.history.length > this.maxSize) {
      this.history.shift();
    }
  }

  get(name = null) {
    if (name) {
      return this.history.filter(h => h.hook === name);
    }
    return Array.from(this.history);
  }

  clear() {
    this.history = [];
    return this;
  }

  setMaxSize(n) {
    this.maxSize = n;
    return this;
  }
}
