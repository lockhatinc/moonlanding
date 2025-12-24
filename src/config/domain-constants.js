// Dynamic constant access from ConfigGeneratorEngine
// These are now loaded from master-config.yml at runtime
// This file is server-side only and should not be bundled with client code

let _cachedEngine = null;

const _getConfigEngine = () => {
  // Lazy-load config engine on first access (server-side only)
  if (typeof window !== 'undefined') {
    // Client-side: return null to use fallback values
    return null;
  }

  if (!_cachedEngine) {
    try {
      // This dynamic import pattern works on server-side only
      // webpackIgnore: true prevents webpack from trying to bundle this on client side
      const configModule = eval('require')('@/lib/config-generator-engine');
      _cachedEngine = configModule.getConfigEngine();
    } catch (err) {
      // Config engine not available yet, will use fallback values
    }
  }
  return _cachedEngine;
};

const _getRolesFromConfig = () => {
  try {
    const engine = _getConfigEngine();
    if (engine) {
      return engine.getRoles();
    }
  } catch (err) {
    console.warn('[domain-constants] Failed to get roles from config:', err.message);
  }
  // Fallback to hardcoded values if config not available
  return {
    partner: 'partner',
    manager: 'manager',
    clerk: 'clerk',
    auditor: 'auditor',
    client: 'client',
    admin: 'admin',
  };
};

const _getRepeatIntervalsFromConfig = () => {
  try {
    const engine = _getConfigEngine();
    if (engine) {
      return engine.getRepeatIntervals();
    }
  } catch (err) {
    console.warn('[domain-constants] Failed to get repeat intervals from config:', err.message);
  }
  // Fallback to hardcoded values if config not available
  return {
    once: 'once',
    monthly: 'monthly',
    yearly: 'yearly',
  };
};

// Export as getters to maintain interface compatibility
export const ROLES = new Proxy({}, {
  get: (target, prop) => {
    const roles = _getRolesFromConfig();
    return roles[String(prop).toLowerCase()];
  }
});

export const USER_TYPES = {
  AUDITOR: 'auditor',
  CLIENT: 'client',
};

export const REPEAT_INTERVALS = new Proxy({}, {
  get: (target, prop) => {
    const intervals = _getRepeatIntervalsFromConfig();
    return intervals[String(prop).toLowerCase()];
  }
});

export const COLORS = {
  DEFAULT: '#B0B0B0',
  SCROLLED_TO: '#7F7EFF',
  PARTNER: '#ff4141',
  RESOLVED: '#44BBA4',
  BADGE: {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
    red: 'bg-red-100 text-red-800',
  },
};

export const BADGE_COLORS_MANTINE = {
  green: { bg: '#d3f9d8', color: '#2f9e44' },
  yellow: { bg: '#fff3bf', color: '#f08c00' },
  amber: { bg: '#ffe066', color: '#d9480f' },
  blue: { bg: '#d0ebff', color: '#1971c2' },
  gray: { bg: '#f1f3f5', color: '#495057' },
  red: { bg: '#ffe0e0', color: '#c92a2a' },
};
