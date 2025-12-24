import { CACHE } from '@/config/auth-config';
import { ERROR_MESSAGES } from '@/config';
import { getCollaboratorRole, checkCollaboratorAccess } from '@/services/collaborator-role.service';

class PermissionService {
  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, createdAt: Date.now() };
    this.CACHE_TTL = CACHE.ttl;
  }

  getCacheKey(user, spec, action, field = null) {
    return `${user?.id}|${spec?.name}|${action}|${field || ''}`;
  }

  clearCache() {
    this.cache.clear();
    this.stats.createdAt = Date.now();
  }

  getCacheStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%'
      : '0%';
    return { ...this.stats, size: this.cache.size, hitRate };
  }

  checkAccess(user, spec, action, options = {}) {
    if (!user) return false;
    if (options.noCache) return this.checkPermission(user, spec, action);
    const key = this.getCacheKey(user, spec, action);
    if (Date.now() - this.stats.createdAt > this.CACHE_TTL) this.clearCache();
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      this.stats.hits++;
      return cached;
    }
    this.stats.misses++;
    const result = this.checkPermission(user, spec, action);
    this.cache.set(key, result);
    return result;
  }

  checkFieldAccess(user, spec, fieldName, action) {
    if (!user) return false;
    const perm = spec.fieldPermissions?.[fieldName];
    if (!perm) return true;
    const allowed = perm[action];
    if (allowed === 'all') return true;
    if (Array.isArray(allowed)) return allowed.includes(user.role);
    return false;
  }

  checkRowAccess(user, spec, record) {
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

  checkPermission(user, spec, action) {
    if (!user) return false;
    return !spec.access?.[action] || spec.access[action].includes(user.role);
  }

  filterRecords(user, spec, records) {
    if (!user || !Array.isArray(records)) return records;
    return records.filter(r => this.checkRowAccess(user, spec, r));
  }

  filterFields(user, spec, record) {
    if (!user) return record;
    const filtered = {};
    for (const [key, value] of Object.entries(record)) {
      if (this.checkFieldAccess(user, spec, key, 'view')) filtered[key] = value;
    }
    return filtered;
  }

  enforceEditPermissions(user, spec, data) {
    if (!user) throw new Error(ERROR_MESSAGES.permissionDenied(`${spec.name}.edit`));
    if (!this.checkAccess(user, spec, 'edit')) throw new Error(ERROR_MESSAGES.permissionDenied(`${spec.name}.edit`));
    for (const field of Object.keys(data)) {
      if (!this.checkFieldAccess(user, spec, field, 'edit')) {
        throw new Error(ERROR_MESSAGES.permissionDenied(`${spec.name}.${field}`));
      }
    }
  }

  canTransition(user, spec, fromStatus, toStatus) {
    if (!user) return false;
    if (!this.checkAccess(user, spec, 'edit')) return false;
    const transitions = spec.transitions?.[fromStatus];
    return Array.isArray(transitions) && transitions.includes(toStatus);
  }

  getAvailableActions(user, spec, record) {
    if (!user) return [];
    const actions = ['view'];
    if (this.checkAccess(user, spec, 'edit') && this.checkRowAccess(user, spec, record)) actions.push('edit');
    if (this.checkAccess(user, spec, 'delete') && this.checkRowAccess(user, spec, record)) actions.push('delete');
    return actions;
  }

  checkActionPermission(user, spec, action, record = null, context = {}) {
    if (!user) return false;

    if (['list', 'view', 'create', 'edit', 'delete'].includes(action)) {
      return this.checkAccess(user, spec, action);
    }

    if (!spec.permissions) return false;

    const rolePermissions = spec.permissions[user.role];
    if (!rolePermissions) return false;

    if (action.endsWith('_own')) {
      if (!rolePermissions.includes(action)) return false;
      if (!record) return false;
      return this.checkOwnership(user, spec, record, action);
    }

    if (action.endsWith('_assigned')) {
      if (!rolePermissions.includes(action)) return false;
      if (!record) return false;
      return this.checkAssignment(user, spec, record);
    }

    if (!rolePermissions.includes(action)) return false;

    if (action === 'respond' || action === 'upload_files') {
      if (!record) return false;
      return this.checkRfiResponse(user, spec, record, context);
    }

    if (action === 'resolve_highlight') {
      if (!record) return false;
      return this.checkHighlightResolve(user, spec, record);
    }

    if (action === 'manage_flags') {
      return this.checkFlagManagement(user, spec, record, context);
    }

    if (action === 'change_status') {
      if (!record) return false;
      return this.checkStatusChange(user, spec, record, context);
    }

    return true;
  }

  checkOwnership(user, spec, record, action) {
    if (!record) return false;

    const baseAction = action.replace('_own', '');

    if (baseAction === 'manage_collaborators') {
      return record.created_by === user.id;
    }

    if (baseAction === 'manage_highlights') {
      return record.created_by === user.id || record.user_id === user.id;
    }

    if (record.created_by) {
      return record.created_by === user.id;
    }

    if (record.user_id) {
      return record.user_id === user.id;
    }

    return false;
  }

  checkAssignment(user, spec, record) {
    if (!record) return false;

    if (record.assigned_to && record.assigned_to === user.id) {
      return true;
    }

    if (record.assigned_users && Array.isArray(record.assigned_users)) {
      return record.assigned_users.includes(user.id);
    }

    if (record.assigned_users && typeof record.assigned_users === 'string') {
      try {
        const parsed = JSON.parse(record.assigned_users);
        if (Array.isArray(parsed)) {
          return parsed.includes(user.id);
        }
      } catch (e) {
        return false;
      }
    }

    return false;
  }

  checkRfiResponse(user, spec, record, context = {}) {
    if (!record) return false;

    if (record.status === 'completed' || record.status === 'closed') {
      return false;
    }

    if (user.role === 'client_admin' || user.role === 'client_user') {
      if (record.client_id && user.client_ids && !user.client_ids.includes(record.client_id)) {
        return false;
      }

      if (user.role === 'client_user') {
        return this.checkAssignment(user, spec, record);
      }

      return true;
    }

    if (['partner', 'manager'].includes(user.role)) {
      return true;
    }

    return false;
  }

  checkHighlightResolve(user, spec, record) {
    if (!record) return false;

    if (user.role === 'partner') {
      return true;
    }

    if (record.resolver_id && record.resolver_id === user.id) {
      return true;
    }

    if (record.created_by === user.id) {
      return true;
    }

    return false;
  }

  checkFlagManagement(user, spec, record = null, context = {}) {
    if (user.role === 'partner') {
      return true;
    }

    if (user.role === 'manager' && context.operation === 'apply') {
      return true;
    }

    return false;
  }

  checkStatusChange(user, spec, record, context = {}) {
    if (!record) return false;

    if (!this.checkAccess(user, spec, 'edit')) {
      return false;
    }

    if (!this.checkRowAccess(user, spec, record)) {
      return false;
    }

    if (context.fromStatus && context.toStatus) {
      return this.canTransition(user, spec, context.fromStatus, context.toStatus);
    }

    return true;
  }

  requireActionPermission(user, spec, action, record = null, context = {}) {
    if (!this.checkActionPermission(user, spec, action, record, context)) {
      throw new Error(ERROR_MESSAGES.permissionDenied(`${spec.name}.${action}`));
    }
  }

  checkCollaboratorPermission(collaboratorId, action, record = null) {
    if (!collaboratorId) {
      return false;
    }

    return checkCollaboratorAccess(collaboratorId, action, record);
  }

  getCollaboratorRole(collaboratorId) {
    if (!collaboratorId) {
      return null;
    }

    return getCollaboratorRole(collaboratorId);
  }

  checkMwrAccess(user, spec, action, record = null, collaboratorId = null) {
    const regularAccess = this.checkAccess(user, spec, action);

    if (regularAccess) {
      return true;
    }

    if (!collaboratorId) {
      return false;
    }

    return this.checkCollaboratorPermission(collaboratorId, action, record);
  }

  checkHighlightAccessForCollaborator(collaboratorId, action, highlight = null) {
    if (!collaboratorId) {
      return false;
    }

    const actionMap = {
      view: 'view_highlights',
      create: 'create_highlights',
      edit: 'edit_highlights',
      resolve: 'resolve_highlights',
      delete: 'delete_highlights'
    };

    const mappedAction = actionMap[action] || action;

    return checkCollaboratorAccess(collaboratorId, mappedAction, highlight);
  }

  canCollaboratorManageRoles(collaboratorId) {
    if (!collaboratorId) {
      return false;
    }

    return checkCollaboratorAccess(collaboratorId, 'assign_roles');
  }
}

export const permissionService = new PermissionService();
