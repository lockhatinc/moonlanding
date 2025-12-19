import { CACHE } from '@/config/auth-config';

const permCache = new Map();
const cacheStats = { hits: 0, misses: 0, createdAt: Date.now() };
const CACHE_TTL = CACHE.ttl;

function getCacheKey(user, spec, action, field = null) {
  return `${user?.id}|${spec?.name}|${action}|${field || ''}`;
}

export function clearPermissionCache() {
  permCache.clear();
  cacheStats.createdAt = Date.now();
}

export function getPermissionCacheStats() {
  const hitRate = cacheStats.hits + cacheStats.misses > 0
    ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2) + '%'
    : '0%';
  return { ...cacheStats, size: permCache.size, hitRate };
}

export function initPermissionDebug() {
  if (typeof window !== 'undefined' && window.__DEBUG__) {
    window.__DEBUG__.getPermissionCacheStats = getPermissionCacheStats;
  }
}

function checkPermission(user, spec, action, field = null) {
  if (!user) return false;
  if (field) {
    const perm = spec.fieldPermissions?.[field];
    if (!perm) return true;
    const allowed = perm[action];
    if (allowed === 'all') return true;
    if (Array.isArray(allowed)) return allowed.includes(user.role);
    return false;
  }
  return !spec.access?.[action] || spec.access[action].includes(user.role);
}

function withPermissionCache(checkFn) {
  return function(user, spec, action, field = null, options = {}) {
    if (options.noCache) return checkFn(user, spec, action, field);
    const key = getCacheKey(user, spec, action, field);
    if (Date.now() - cacheStats.createdAt > CACHE_TTL) clearPermissionCache();
    const cached = permCache.get(key);
    if (cached !== undefined) {
      cacheStats.hits++;
      return cached;
    }
    cacheStats.misses++;
    const result = checkFn(user, spec, action, field);
    permCache.set(key, result);
    return result;
  };
}

const cachedCheckPermission = withPermissionCache(checkPermission);

function createPermissionChecker(action = null, field = null) {
  return (user, spec, actionOrField, options = {}) => {
    const resolvedAction = action || actionOrField;
    const resolvedField = field !== null ? actionOrField : null;
    return cachedCheckPermission(user, spec, resolvedAction, resolvedField, options);
  };
}

export const can = createPermissionChecker();
export const canViewField = createPermissionChecker('view', true);
export const canEditField = createPermissionChecker('edit', true);

export function check(user, spec, action) {
  if (!can(user, spec, action)) throw new Error(`Permission denied: ${spec.name}.${action}`);
}

export function filterFieldsByAccess(user, spec, record) {
  if (!user) return record;
  const filtered = {};
  for (const [key, value] of Object.entries(record)) {
    if (canViewField(user, spec, key)) filtered[key] = value;
  }
  return filtered;
}

export function canAccessRow(user, spec, record) {
  if (!user) return false;
  if (!spec.rowAccess) return true;
  const rowPerm = spec.rowAccess;
  if (rowPerm.scope === 'team' && record.team_id && user.team_id && record.team_id !== user.team_id) return false;
  if (rowPerm.scope === 'assigned' && record.assigned_to && record.assigned_to !== user.id && user.role !== 'partner') return false;
  if (rowPerm.scope === 'assigned_or_team' && user.role !== 'partner') {
    const assignedCheck = !record.assigned_to || record.assigned_to === user.id;
    const teamCheck = !record.team_id || (user.team_id && record.team_id === user.team_id);
    if (!assignedCheck && !teamCheck) return false;
  }
  if (rowPerm.scope === 'client' && record.client_id && user.client_ids && !user.client_ids.includes(record.client_id)) return false;
  return true;
}

export function filterRecordsByAccess(user, spec, records) {
  if (!user || !Array.isArray(records)) return records;
  return records.filter(r => canAccessRow(user, spec, r));
}
