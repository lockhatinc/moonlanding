import { getConfigEngineSync } from '@/lib/config-generator-engine';

const _engine = () => {
  try { return getConfigEngineSync(); } catch { return null; }
};

const _roleNames = () => {
  const engine = _engine();
  if (engine) {
    const roles = engine.getRoles();
    const result = {};
    for (const key of Object.keys(roles)) result[key] = key;
    return result;
  }
  return { partner: 'partner', manager: 'manager', clerk: 'clerk', client_admin: 'client_admin', client_user: 'client_user' };
};

export const ROLES = new Proxy({}, {
  get: (_, prop) => {
    if (typeof prop === 'symbol') return undefined;
    const roles = _roleNames();
    return roles[String(prop).toLowerCase()];
  },
  ownKeys: () => Object.keys(_roleNames()),
  getOwnPropertyDescriptor: (_, prop) => {
    const roles = _roleNames();
    const key = String(prop).toLowerCase();
    if (key in roles) return { configurable: true, enumerable: true, value: roles[key] };
    return undefined;
  },
});

export const USER_TYPES = { AUDITOR: 'auditor', CLIENT: 'client' };

const _intervals = () => {
  const engine = _engine();
  return engine ? engine.getRepeatIntervals() : { once: 'once', monthly: 'monthly', yearly: 'yearly' };
};

export const REPEAT_INTERVALS = new Proxy({}, {
  get: (_, prop) => {
    if (typeof prop === 'symbol') return undefined;
    return _intervals()[String(prop).toLowerCase()];
  },
  ownKeys: () => Object.keys(_intervals()),
  getOwnPropertyDescriptor: (_, prop) => {
    const intervals = _intervals();
    const key = String(prop).toLowerCase();
    if (key in intervals) return { configurable: true, enumerable: true, value: intervals[key] };
    return undefined;
  },
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
