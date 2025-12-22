export class SubscriptionManager {
  constructor(options = {}) {
    this.subscriptions = new Map();
    this.pollInterval = options.pollInterval || 3000;
    this.maxSubscribers = options.maxSubscribers || 100;
    this.deduplicateByUrl = options.deduplicateByUrl !== false;
  }

  subscribe(key, url, onData, onError) {
    if (this.subscriptions.size >= this.maxSubscribers) {
      throw new Error(`Max subscriptions (${this.maxSubscribers}) reached`);
    }

    const existing = this.deduplicateByUrl ? this.findByUrl(url) : null;
    if (existing) {
      existing.subscribers.push({ callback: onData, error: onError });
      return () => this.unsubscribe(key, onData);
    }

    const subscription = {
      key,
      url,
      subscribers: [{ callback: onData, error: onError }],
      lastPoll: 0,
      lastData: null,
      pollTimer: null,
      retries: 0,
      maxRetries: 3,
    };

    this.subscriptions.set(key, subscription);
    this.poll(key);

    return () => this.unsubscribe(key, onData);
  }

  async poll(key) {
    const sub = this.subscriptions.get(key);
    if (!sub) return;

    try {
      const response = await fetch(sub.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (JSON.stringify(data) !== JSON.stringify(sub.lastData)) {
        sub.lastData = data;
        sub.subscribers.forEach(s => s.callback(data));
      }
      sub.retries = 0;
    } catch (e) {
      sub.retries += 1;
      if (sub.retries <= sub.maxRetries) {
        sub.subscribers.forEach(s => s.error?.(e));
      } else {
        this.unsubscribe(key);
      }
    }

    sub.lastPoll = Date.now();
    sub.pollTimer = setTimeout(() => this.poll(key), this.pollInterval);
  }

  unsubscribe(key, callback = null) {
    const sub = this.subscriptions.get(key);
    if (!sub) return;

    if (callback) {
      sub.subscribers = sub.subscribers.filter(s => s.callback !== callback);
      if (sub.subscribers.length > 0) return;
    }

    if (sub.pollTimer) clearTimeout(sub.pollTimer);
    this.subscriptions.delete(key);
  }

  unsubscribeAll() {
    for (const key of this.subscriptions.keys()) {
      this.unsubscribe(key);
    }
  }

  findByUrl(url) {
    for (const sub of this.subscriptions.values()) {
      if (sub.url === url) return sub;
    }
    return null;
  }

  getStats() {
    const stats = { active: this.subscriptions.size, details: {} };
    for (const [key, sub] of this.subscriptions.entries()) {
      stats.details[key] = {
        url: sub.url,
        subscribers: sub.subscribers.length,
        lastPoll: sub.lastPoll,
        retries: sub.retries,
      };
    }
    return stats;
  }
}

export const subscriptionManager = new SubscriptionManager();
