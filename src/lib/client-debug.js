let apiCalls = [];
let apiErrors = [];
let entities = new Map();
let permissionCache = new Map();
let applicationErrors = [];
let currentUser = null;
let watchedEndpoints = new Set();
const MAX_CALLS = 50;
const MAX_ERRORS = 100;

function recordApiCall(method, url, status, duration, response, error = null) {
  apiCalls.push({
    timestamp: new Date().toISOString(),
    method,
    url,
    status,
    duration,
    response: error ? null : response,
    error: error ? error.message : null,
  });
  if (apiCalls.length > MAX_CALLS) apiCalls.shift();
  if (error) recordApiError({ method, url, status, error, response });
}

function recordApiError(error) {
  apiErrors.push({ ...error, timestamp: new Date().toISOString() });
  if (apiErrors.length > MAX_ERRORS) apiErrors.shift();
}

function recordApplicationError(message, context = {}) {
  applicationErrors.push({
    timestamp: new Date().toISOString(),
    message,
    context,
    stack: new Error().stack,
  });
  if (applicationErrors.length > MAX_ERRORS) applicationErrors.shift();
}

function recordEntity(type, data) {
  if (!entities.has(type)) entities.set(type, new Map());
  if (Array.isArray(data)) {
    data.forEach(record => entities.get(type).set(record.id, record));
  } else {
    entities.get(type).set(data.id, data);
  }
}

function recordPermissionCheck(userId, entityName, action, result) {
  const key = `${userId}|${entityName}|${action}`;
  permissionCache.set(key, {
    timestamp: Date.now(),
    userId,
    entityName,
    action,
    result,
  });
  if (permissionCache.size > 1000) {
    const first = permissionCache.keys().next().value;
    permissionCache.delete(first);
  }
}

function setCurrentUser(user) {
  currentUser = {
    id: user?.id,
    email: user?.email,
    role: user?.role,
    type: user?.type,
    hierarchy: user?.hierarchy,
  };
}

export const DEBUG = {
  state() {
    return {
      user: currentUser,
      apiCalls: apiCalls.length,
      apiErrors: apiErrors.length,
      entities: Array.from(entities.entries()).map(([type, data]) => ({
        type,
        count: data.size,
      })),
      applicationErrors: applicationErrors.length,
      permissionCacheSize: permissionCache.size,
    };
  },

  errors() {
    return applicationErrors;
  },

  entities: {
    get(type, id) {
      return entities.get(type)?.get(id);
    },
    list(type) {
      return Array.from(entities.get(type)?.values() || []);
    },
    table() {
      const rows = [];
      for (const [type, typeMap] of entities) {
        for (const [id, data] of typeMap) {
          rows.push({ type, id, record: data });
        }
      }
      return rows;
    },
  },

  permissions: {
    cache() {
      const entries = [];
      for (const [key, value] of permissionCache) {
        const [userId, entityName, action] = key.split('|');
        entries.push({ userId, entityName, action, result: value.result });
      }
      return entries;
    },
    clearCache() {
      permissionCache.clear();
    },
    trace(opts) {
      const cached = permissionCache.get(`${opts.userId}|${opts.entityName}|${opts.action}`);
      return cached || 'NOT_CACHED - will evaluate on next check';
    },
  },

  api: {
    calls() {
      return apiCalls;
    },
    lastError() {
      return apiErrors[apiErrors.length - 1] || null;
    },
    watch(endpoint) {
      watchedEndpoints.add(endpoint);
      console.log(`[DEBUG] Watching endpoint: ${endpoint}`);
    },
    table() {
      return apiCalls.map(call => ({
        time: call.timestamp,
        method: call.method,
        url: call.url,
        status: call.status,
        duration: `${call.duration}ms`,
        error: call.error || 'OK',
      }));
    },
  },

  user: {
    current() {
      return currentUser;
    },
  },

  record: {
    apiCall: recordApiCall,
    apiError: recordApiError,
    appError: recordApplicationError,
    entity: recordEntity,
    permission: recordPermissionCheck,
    user: setCurrentUser,
  },
};

export function initClientDebug() {
  if (typeof window !== 'undefined') {
    window.__DEBUG__ = DEBUG;
    console.log('[DEBUG] Client debug initialized: window.__DEBUG__');
  }
}

export function recordApiResponse(method, url, status, duration, response, error = null) {
  recordApiCall(method, url, status, duration, response, error);
}

export function recordError(message, context = {}) {
  recordApplicationError(message, context);
  console.error(`[DEBUG] ${message}`, context);
}
