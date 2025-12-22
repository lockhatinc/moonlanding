import { BasePlugin } from '@/framework';

export const GLOBAL_STATE_SCHEMA = {
  ui: {
    sidebarOpen: { type: 'boolean', default: true },
    theme: { type: 'string', default: 'light', values: ['light', 'dark'] },
    notificationsEnabled: { type: 'boolean', default: true },
    modal: { type: 'object', default: null },
  },
  entities: {
    cache: { type: 'object', default: {} },
    filters: { type: 'object', default: {} },
    sort: { type: 'object', default: {} },
    search: { type: 'object', default: {} },
  },
  user: {
    authenticated: { type: 'boolean', default: false },
    id: { type: 'string', default: null },
    email: { type: 'string', default: null },
    role: { type: 'string', default: null },
    permissions: { type: 'array', default: [] },
  },
  notifications: {
    queue: { type: 'array', default: [] },
    unread: { type: 'number', default: 0 },
  },
  sync: {
    pending: { type: 'array', default: [] },
    failed: { type: 'array', default: [] },
    lastSync: { type: 'number', default: 0 },
  },
};

export class GlobalStateManager extends BasePlugin {
  constructor() {
    super('GlobalStateManager');
    this.state = this.initializeState();
    this.subscribers = new Set();
    this.history = [];
    this.maxHistory = 50;
  }

  initializeState() {
    const state = {};
    Object.entries(GLOBAL_STATE_SCHEMA).forEach(([section, fields]) => {
      state[section] = {};
      Object.entries(fields).forEach(([key, config]) => {
        state[section][key] = config.default;
      });
    });
    return state;
  }

  setState(path, value) {
    const keys = path.split('.');
    let current = this.state;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    const oldValue = current[lastKey];

    if (oldValue !== value) {
      current[lastKey] = value;
      this.recordHistory(path, oldValue, value);
      this.notifySubscribers();
    }
  }

  getState(path = null) {
    if (!path) return { ...this.state };

    const keys = path.split('.');
    let current = this.state;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => {
      try {
        cb(this.state);
      } catch (e) {
        console.error('State subscriber error:', e);
      }
    });
  }

  recordHistory(path, oldValue, newValue) {
    this.history.push({
      path,
      oldValue,
      newValue,
      timestamp: Date.now(),
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getHistory(path = null) {
    if (!path) return this.history;
    return this.history.filter(h => h.path === path);
  }

  reset() {
    this.state = this.initializeState();
    this.history = [];
    this.notifySubscribers();
  }

  resetSection(section) {
    const schema = GLOBAL_STATE_SCHEMA[section];
    if (schema) {
      Object.entries(schema).forEach(([key, config]) => {
        this.setState(`${section}.${key}`, config.default);
      });
    }
  }
}

export const globalStateManager = new GlobalStateManager();

export function useGlobalState(path) {
  if (typeof window === 'undefined') return null;

  const [state, setState] = require('react').useState(globalStateManager.getState(path));

  require('react').useEffect(() => {
    return globalStateManager.subscribe((newState) => {
      setState(globalStateManager.getState(path));
    });
  }, [path]);

  return state;
}

export function setGlobalState(path, value) {
  globalStateManager.setState(path, value);
}

export function getGlobalState(path = null) {
  return globalStateManager.getState(path);
}
