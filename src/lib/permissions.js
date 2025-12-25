let DEFAULT_CACHE_TTL = 5 * 60 * 1000;
let permissionCache = new Map();

async function initializeCacheTTL() {
  // Client-side: skip config loading, use default
  if (typeof window !== 'undefined') {
    return;
  }

  try {
    // Use eval to prevent webpack from bundling this import on client side
    const importFunc = eval('import');
    const { getConfigEngine } = await importFunc('@/lib/config-generator-engine');
    const engine = await getConfigEngine();
    const config = engine.getConfig();
    DEFAULT_CACHE_TTL = config?.thresholds?.cache?.permission_ttl_ms || 5 * 60 * 1000;
  } catch (e) {
    console.warn('[PERMISSIONS] Failed to load cache TTL from config, using default:', e.message);
  }
}

initializeCacheTTL();

function getCacheKey(...args) {
  return args.filter(Boolean).join('|');
}

function cacheGet(key) {
  const entry = permissionCache.get(key);
  if (entry && Date.now() - entry.timestamp < DEFAULT_CACHE_TTL) {
    return entry.value;
  }
  permissionCache.delete(key);
  return null;
}

function cacheSet(key, value) {
  permissionCache.set(key, { value, timestamp: Date.now() });
}

export async function can(user, spec, action) {
  if (!user) return false;
  const cacheKey = getCacheKey(user?.id, spec?.name, action);
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached;

  // Check if user's role is in the allowed roles for this action
  const allowedRoles = spec.permissions?.[action] || [];
  const result = Array.isArray(allowedRoles) && allowedRoles.includes(user.role);

  cacheSet(cacheKey, result);
  return result;
}

export function check(user, spec, action) {
  if (!can(user, spec, action)) {
    throw new Error(`Permission denied: ${spec?.name || 'unknown'}.${action}`);
  }
}

export async function canViewField(user, spec, field) {
  if (!user || !field) return false;
  const cacheKey = getCacheKey(user?.id, spec?.name, field, 'view');
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached;

  // Check field-level view permissions if defined
  const fieldPermissions = spec.fieldPermissions?.[field];
  if (fieldPermissions && fieldPermissions.view) {
    const allowedRoles = fieldPermissions.view;
    const result = Array.isArray(allowedRoles) ? allowedRoles.includes(user.role) : allowedRoles === 'all' || allowedRoles === true;
    cacheSet(cacheKey, result);
    return result;
  }

  // Fall back to entity-level view permission
  const entityCanView = spec.permissions?.view?.includes(user.role) ?? true;
  cacheSet(cacheKey, entityCanView);
  return entityCanView;
}

export async function canEditField(user, spec, field) {
  if (!user || !field) return false;
  const cacheKey = getCacheKey(user?.id, spec?.name, field, 'edit');
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached;

  // Check field-level edit permissions if defined
  const fieldPermissions = spec.fieldPermissions?.[field];
  if (fieldPermissions && fieldPermissions.edit) {
    const allowedRoles = fieldPermissions.edit;
    const result = Array.isArray(allowedRoles) ? allowedRoles.includes(user.role) : allowedRoles === 'all' || allowedRoles === true;
    cacheSet(cacheKey, result);
    return result;
  }

  // Fall back to entity-level edit permission
  const entityCanEdit = spec.permissions?.edit?.includes(user.role) ?? false;
  cacheSet(cacheKey, entityCanEdit);
  return entityCanEdit;
}

export async function canAccessRow(user, spec, record) {
  if (!user || !record) return false;
  return true;
}

export function filterRecordsByAccess(user, spec, records = []) {
  return records;
}

export function filterFieldsByAccess(user, spec, fields = []) {
  return fields;
}

export function clearCache() {
  permissionCache.clear();
}

export function invalidateCache(userId = null) {
  if (userId) {
    for (const key of permissionCache.keys()) {
      if (key.startsWith(userId)) {
        permissionCache.delete(key);
      }
    }
  } else {
    permissionCache.clear();
  }
}
