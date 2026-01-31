const QUEUE_KEY = 'moonlanding-offline-queue';
const MAX_QUEUE_SIZE = 100;

class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue();
    this.listeners = new Set();
  }

  loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
      return [];
    }
  }

  saveQueue() {
    try {
      if (this.queue.length > MAX_QUEUE_SIZE) {
        this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
      }
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  }

  addRequest(request) {
    const queueItem = {
      id: generateId(),
      timestamp: Date.now(),
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      body: null,
      status: 'pending',
      retryCount: 0,
      lastError: null
    };

    if (request.body) {
      queueItem.body = request.body;
    }

    this.queue.push(queueItem);
    this.saveQueue();

    console.log('[OfflineQueue] Request queued:', queueItem.id, queueItem.url);

    return queueItem.id;
  }

  getQueue() {
    return [...this.queue];
  }

  getPendingRequests() {
    return this.queue.filter(item => item.status === 'pending');
  }

  async processQueue(checkConnectivity) {
    const isOnline = await checkConnectivity();
    if (!isOnline) {
      console.log('[OfflineQueue] Still offline, skipping queue processing');
      return { processed: 0, failed: 0, errors: [] };
    }

    const pendingRequests = this.getPendingRequests();
    const results = { processed: 0, failed: 0, errors: [] };

    for (const item of pendingRequests) {
      try {
        const request = new Request(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
          credentials: 'include'
        });

        const response = await fetch(request);

        if (response.ok) {
          this.removeRequest(item.id);
          results.processed++;
          console.log('[OfflineQueue] Request processed:', item.id);
        } else {
          item.retryCount++;
          item.status = 'failed';
          item.lastError = `HTTP ${response.status}`;

          if (item.retryCount >= 3) {
            this.removeRequest(item.id);
            results.failed++;
            results.errors.push({
              id: item.id,
              url: item.url,
              error: item.lastError
            });
          } else {
            this.saveQueue();
          }
        }
      } catch (error) {
        item.retryCount++;
        item.status = 'failed';
        item.lastError = error.message;

        if (item.retryCount >= 3) {
          this.removeRequest(item.id);
          results.failed++;
          results.errors.push({
            id: item.id,
            url: item.url,
            error: item.lastError
          });
        } else {
          this.saveQueue();
        }

        console.error('[OfflineQueue] Request failed:', item.id, error.message);
      }
    }

    return results;
  }

  removeRequest(id) {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveQueue();
    }
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.getQueue());
    });
  }

  getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      failed: this.queue.filter(item => item.status === 'failed').length,
      oldestRequest: this.queue.length > 0 ? this.queue[0].timestamp : null
    };
  }
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const offlineQueue = new OfflineQueue();

export default OfflineQueue;
