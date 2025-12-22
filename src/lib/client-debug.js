'use client';

let appState = {
  user: null,
  currentPage: null,
  entities: {},
  api: {
    calls: [],
    lastError: null,
  },
  ui: {
    activeTab: null,
    openModals: [],
    messages: [],
  },
  cache: {},
};

export function initDebug() {
  if (typeof window === 'undefined') return;

  let errors = [];

  window.__DEBUG__ = {
    getState: () => appState,
    setState: (key, value) => { appState[key] = value; console.log(`[DEBUG] Set ${key}:`, value); },
    setUser: (user) => { appState.user = user; },
    setPage: (page) => { appState.currentPage = page; },
    setEntity: (name, data) => { appState.entities[name] = data; },
    addApiCall: (method, url, status, duration) => {
      appState.api.calls.push({ method, url, status, duration, timestamp: new Date() });
      if (appState.api.calls.length > 100) appState.api.calls.shift();
    },
    setApiError: (error) => { appState.api.lastError = error; },
    getApiCalls: () => appState.api.calls,
    getLastApiError: () => appState.api.lastError,
    clearApiCalls: () => { appState.api.calls = []; },
    getEntity: (name) => appState.entities[name],
    getAllEntities: () => appState.entities,
    setCache: (key, value) => { appState.cache[key] = value; },
    getCache: (key) => appState.cache[key],
    clearCache: () => { appState.cache = {}; },
    getAll: () => appState,
    log: (msg, data) => console.log(`[APP] ${msg}`, data || ''),
    error: (msg, context) => {
      const err = { msg, context, timestamp: new Date(), stack: new Error().stack };
      errors.push(err);
      if (errors.length > 50) errors.shift();
      console.error(`[ERROR] ${msg}`, context || '');
      return err;
    },
    getErrors: () => errors,
    clearErrors: () => { errors = []; },
    getPermissionCacheStats: null,
    tables: {
      apiCalls: () => console.table(appState.api.calls),
      entities: () => console.table(appState.entities),
      cache: () => console.table(appState.cache),
      errors: () => console.table(errors),
    },
  };
}

export function logApiCall(method, url, status, duration) {
  if (window.__DEBUG__) {
    window.__DEBUG__.addApiCall(method, url, status, duration);
  }
}

export function logApiError(error) {
  if (window.__DEBUG__) {
    const { LOG_PREFIXES } = require('@/config');
    window.__DEBUG__.setApiError(error);
    console.error(LOG_PREFIXES.api, error);
  }
}

export function setCurrentUser(user) {
  if (window.__DEBUG__) {
    window.__DEBUG__.setUser(user);
  }
}

export function setCurrentEntity(name, data) {
  if (window.__DEBUG__) {
    window.__DEBUG__.setEntity(name, data);
  }
}
