export const CACHE_DEFAULTS = {
  ttl: 3600000,
  maxSize: 100,
  maxAge: 24 * 60 * 60 * 1000,
};

export const CACHE_RULES = {
  session: {
    ttl: 600000,
    key: 'session',
    invalidateOn: ['logout'],
  },

  userProfile: {
    ttl: 300000,
    key: 'user',
    invalidateOn: ['user.update'],
  },

  entities: {
    ttl: 1800000,
    key: 'entity',
    invalidateOn: ['entity.create', 'entity.update', 'entity.delete'],
  },

  permissions: {
    ttl: 1800000,
    key: 'permissions',
    invalidateOn: ['permissions.update'],
  },

  tokens: {
    ttl: 86400000,
    key: 'token',
    invalidateOn: ['logout', 'token.refresh'],
  },
};

export const CACHE_STRATEGIES = {
  memory: { type: 'memory', maxSize: 100 },
  redis: { type: 'redis', host: 'localhost', port: 6379 },
  session: { type: 'session' },
};

export const CACHE_CONFIG = {
  enabled: true,
  strategy: 'memory',
  compression: false,
};

export function getCacheRule(key) {
  return CACHE_RULES[key] || { ttl: CACHE_DEFAULTS.ttl };
}

export function shouldInvalidateCache(cacheKey, event) {
  const rule = CACHE_RULES[cacheKey];
  if (!rule) return false;
  return rule.invalidateOn?.includes(event) || false;
}
