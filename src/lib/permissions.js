export async function can(user, spec, action) {
  if (!user) return false;
  const allowedRoles = spec.permissions?.[action] || [];
  return Array.isArray(allowedRoles) && allowedRoles.includes(user.role);
}

export function check(user, spec, action) {
  if (!can(user, spec, action)) {
    throw new Error(`Permission denied: ${spec?.name || 'unknown'}.${action}`);
  }
}

export async function canViewField(user, spec, field) {
  if (!user || !field) return false;
  const fieldPermissions = spec.fieldPermissions?.[field];
  if (fieldPermissions && fieldPermissions.view) {
    const allowedRoles = fieldPermissions.view;
    return Array.isArray(allowedRoles) ? allowedRoles.includes(user.role) : allowedRoles === 'all' || allowedRoles === true;
  }
  return spec.permissions?.view?.includes(user.role) ?? true;
}

export async function canEditField(user, spec, field) {
  if (!user || !field) return false;
  const fieldPermissions = spec.fieldPermissions?.[field];
  if (fieldPermissions && fieldPermissions.edit) {
    const allowedRoles = fieldPermissions.edit;
    return Array.isArray(allowedRoles) ? allowedRoles.includes(user.role) : allowedRoles === 'all' || allowedRoles === true;
  }
  return spec.permissions?.edit?.includes(user.role) ?? false;
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
}

export function invalidateCache(userId = null) {
}
