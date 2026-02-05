import { getCollaboratorRole, checkCollaboratorAccess } from '@/services/collaborator-role.service';
import { PermissionError } from '@/lib/error-handler';
import { getConfigEngineSync } from '@/lib/config-generator-engine';

function getRolesConfig() {
  try { return getConfigEngineSync().getRoles(); } catch { return {}; }
}

class PermissionService {
  can(user, spec, action) {
    if (!user) return false;
    if (!spec?.access?.[action]) return true;
    return spec.access[action].includes(user.role);
  }

  require(user, spec, action) {
    if (!this.can(user, spec, action)) throw PermissionError(`Cannot ${action} ${spec?.name || 'unknown'}`);
  }

  checkFieldAccess(user, spec, fieldName, action) {
    if (!user) return false;
    const perm = spec.fieldPermissions?.[fieldName];
    if (!perm) return true;
    const allowed = perm[action];
    if (allowed === 'all') return true;
    return Array.isArray(allowed) && allowed.includes(user.role);
  }

  checkRowAccess(user, spec, record) {
    if (!user) return false;
    const rowAccess = spec.rowAccess || spec.row_access;
    if (!rowAccess) return true;
    const roles = getRolesConfig();
    const partnerRole = Object.keys(roles).find(r => roles[r].hierarchy === 0);
    const clientAdminRole = Object.keys(roles).find(r => r.includes('client') && r.includes('admin'));
    const clientUserRole = Object.keys(roles).find(r => r === 'client_user');
    if (rowAccess.scope === 'team' && record.team_id && user.team_id && record.team_id !== user.team_id) return false;
    if (rowAccess.scope === 'assigned' && record.assigned_to && record.assigned_to !== user.id && user.role !== partnerRole) return false;
    if (rowAccess.scope === 'assigned_or_team' && user.role !== partnerRole) {
      if ((!record.assigned_to || record.assigned_to !== user.id) && (!record.team_id || !user.team_id || record.team_id !== user.team_id)) return false;
    }
    if (rowAccess.scope === 'client') {
      if ((clientAdminRole && user.role === clientAdminRole) || (clientUserRole && user.role === clientUserRole)) {
        if (record.client_id && user.client_id && record.client_id !== user.client_id) return false;
        if (clientUserRole && user.role === clientUserRole && !this.checkAssignment(user, spec, record)) return false;
      } else if (record.client_id && user.client_ids && !user.client_ids.includes(record.client_id)) {
        return false;
      }
    }
    return true;
  }

  filterRecords(user, spec, records) {
    if (!user || !Array.isArray(records)) return records;
    return records.filter(r => this.checkRowAccess(user, spec, r));
  }

  filterFields(user, spec, record) {
    if (!user) return record;
    const filtered = {};
    for (const [key, value] of Object.entries(record)) {
      if (spec.fields?.[key]?.hidden) continue;
      if (this.checkFieldAccess(user, spec, key, 'view')) filtered[key] = value;
    }
    return filtered;
  }

  enforceEditPermissions(user, spec, data) {
    if (!user) throw PermissionError(`Cannot edit ${spec.name}`);
    if (!this.can(user, spec, 'edit')) throw PermissionError(`Cannot edit ${spec.name}`);
    for (const field of Object.keys(data)) {
      if (!this.checkFieldAccess(user, spec, field, 'edit')) throw PermissionError(`Cannot edit ${spec.name}.${field}`);
    }
  }

  checkOwnership(user, spec, record) {
    if (!record) return false;
    return record.created_by === user.id || record.user_id === user.id;
  }

  checkAssignment(user, spec, record) {
    if (!record) return false;
    if (record.assigned_to === user.id) return true;
    if (Array.isArray(record.assigned_users)) return record.assigned_users.includes(user.id);
    if (typeof record.assigned_users === 'string') {
      try { return JSON.parse(record.assigned_users).includes(user.id); } catch { return false; }
    }
    return false;
  }

  checkActionPermission(user, spec, action, record = null, context = {}) {
    if (!user) return false;
    if (spec?.access?.[action]) return spec.access[action].includes(user.role);
    if (action.endsWith('_own')) {
      const base = action.replace(/_own$/, '');
      return spec?.access?.[action]?.includes(user.role) && record && this.checkOwnership(user, spec, record);
    }
    if (action.endsWith('_assigned')) return record && this.checkAssignment(user, spec, record);
    return spec?.permissions?.[user.role]?.includes(action) || false;
  }

  requireActionPermission(user, spec, action, record = null, context = {}) {
    if (!this.checkActionPermission(user, spec, action, record, context)) throw PermissionError(`Cannot ${action} ${spec.name}`);
  }

  getAvailableActions(user, spec, record) {
    if (!user) return [];
    const actions = ['view'];
    if (this.can(user, spec, 'edit') && this.checkRowAccess(user, spec, record)) actions.push('edit');
    if (this.can(user, spec, 'delete') && this.checkRowAccess(user, spec, record)) actions.push('delete');
    return actions;
  }

  checkMwrAccess(user, spec, action, record = null, collaboratorId = null) {
    if (this.can(user, spec, action)) return true;
    return collaboratorId ? checkCollaboratorAccess(collaboratorId, action, record) : false;
  }

  checkCollaboratorPermission(collaboratorId, action, record = null) {
    return collaboratorId ? checkCollaboratorAccess(collaboratorId, action, record) : false;
  }

  getCollaboratorRole(collaboratorId) {
    return collaboratorId ? getCollaboratorRole(collaboratorId) : null;
  }
}

export const permissionService = new PermissionService();

export function can(user, spec, action) { return permissionService.can(user, spec, action); }
export function check(user, spec, action) { permissionService.require(user, spec, action); }
export function canAccessRow() { return true; }

export function getAllRoles() {
  return Object.keys(getRolesConfig());
}

export function getRoleLabel(role) {
  const roles = getRolesConfig();
  return roles[role]?.label || role;
}

export function getRoleDescription(role) {
  const roles = getRolesConfig();
  return roles[role]?.description || '';
}

export function getPermissionMatrix() {
  try {
    const engine = getConfigEngineSync();
    const entities = engine.getAllEntities();
    const matrix = {};
    for (const role of getAllRoles()) {
      matrix[role] = {};
      for (const entityName of entities) {
        try {
          const spec = engine.generateEntitySpec(entityName);
          matrix[role][entityName] = spec.permissions?.[role] || [];
        } catch { matrix[role][entityName] = []; }
      }
    }
    return matrix;
  } catch { return {}; }
}
