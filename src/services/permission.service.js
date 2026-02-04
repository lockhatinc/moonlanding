import { PermissionError } from '@/lib/error-handler';
import { getCollaboratorRole, checkCollaboratorAccess } from '@/services/collaborator-role.service';
import { get } from '@/engine';

const ROLE_LABELS = { partner: 'Partner', manager: 'Manager', clerk: 'Clerk', client_admin: 'Client Admin', client_user: 'Client User' };
const ROLE_LIST = Object.keys(ROLE_LABELS);

class PermissionService {
  can(user, spec, action) {
    if (!user) return false;
    return !spec?.access?.[action] || spec.access[action].includes(user.role);
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
    if (rowAccess.scope === 'team' && record.team_id && user.team_id && record.team_id !== user.team_id) return false;
    if (rowAccess.scope === 'assigned' && record.assigned_to && record.assigned_to !== user.id && user.role !== 'partner') return false;
    if (rowAccess.scope === 'assigned_or_team' && user.role !== 'partner') {
      if ((!record.assigned_to || record.assigned_to !== user.id) && (!record.team_id || !user.team_id || record.team_id !== user.team_id)) return false;
    }
    if (rowAccess.scope === 'client') {
      if (user.role === 'client_admin' || user.role === 'client_user') {
        if (record.client_id && user.client_id && record.client_id !== user.client_id) return false;
        if (user.role === 'client_user' && !this.checkAssignment(user, spec, record)) return false;
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

  checkOwnership(user, spec, record, action) {
    if (!record) return false;
    const base = action?.replace('_own', '') || '';
    if (base === 'manage_collaborators') return record.created_by === user.id;
    if (base === 'manage_highlights') return record.created_by === user.id || record.user_id === user.id;
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
    if (['list', 'view', 'create', 'edit', 'delete'].includes(action)) return this.can(user, spec, action);
    if (!spec.permissions) return false;
    const rolePerms = spec.permissions[user.role];
    if (!rolePerms) return false;
    if (action.endsWith('_own')) return rolePerms.includes(action) && record && this.checkOwnership(user, spec, record, action);
    if (action.endsWith('_assigned')) return rolePerms.includes(action) && record && this.checkAssignment(user, spec, record);
    if (!rolePerms.includes(action)) return false;
    if ((action === 'respond' || action === 'upload_files') && record) return this.checkRfiResponse(user, spec, record, context);
    if (action === 'resolve_highlight' && record) return this.checkHighlightResolve(user, record);
    if (action === 'manage_flags') return this.checkFlagManagement(user, context);
    if (action === 'change_status' && record) return this.can(user, spec, 'edit') && this.checkRowAccess(user, spec, record) && (!context.fromStatus || !context.toStatus || this.canTransition(spec, context.fromStatus, context.toStatus));
    return true;
  }

  requireActionPermission(user, spec, action, record = null, context = {}) {
    if (!this.checkActionPermission(user, spec, action, record, context)) throw PermissionError(`Cannot ${action} ${spec.name}`);
  }

  canTransition(spec, fromStatus, toStatus) {
    const transitions = spec.transitions?.[fromStatus];
    return Array.isArray(transitions) && transitions.includes(toStatus);
  }

  getAvailableActions(user, spec, record) {
    if (!user) return [];
    const actions = ['view'];
    if (this.can(user, spec, 'edit') && this.checkRowAccess(user, spec, record)) actions.push('edit');
    if (this.can(user, spec, 'delete') && this.checkRowAccess(user, spec, record)) actions.push('delete');
    return actions;
  }

  checkRfiResponse(user, spec, record, context = {}) {
    if (!record || record.status === 'completed' || record.status === 'closed') return false;
    if (user.role === 'client_admin') return !(record.client_id && user.client_ids && !user.client_ids.includes(record.client_id));
    if (user.role === 'client_user') return !(record.client_id && user.client_ids && !user.client_ids.includes(record.client_id)) && this.checkAssignment(user, spec, record);
    return ['partner', 'manager'].includes(user.role);
  }

  checkHighlightResolve(user, record) {
    if (!record) return false;
    return user.role === 'partner' || record.resolver_id === user.id || record.created_by === user.id;
  }

  checkFlagManagement(user, context = {}) {
    if (user.role === 'partner') return true;
    return user.role === 'manager' && context.operation === 'apply';
  }

  checkMwrAccess(user, spec, action, record = null, collaboratorId = null) {
    if (this.can(user, spec, action)) return true;
    return collaboratorId ? checkCollaboratorAccess(collaboratorId, action, record) : false;
  }

  checkHighlightAccessForCollaborator(collaboratorId, action, highlight = null) {
    if (!collaboratorId) return false;
    const map = { view: 'view_highlights', create: 'create_highlights', edit: 'edit_highlights', resolve: 'resolve_highlights', delete: 'delete_highlights' };
    return checkCollaboratorAccess(collaboratorId, map[action] || action, highlight);
  }

  checkCollaboratorPermission(collaboratorId, action, record = null) {
    return collaboratorId ? checkCollaboratorAccess(collaboratorId, action, record) : false;
  }

  getCollaboratorRole(collaboratorId) {
    return collaboratorId ? getCollaboratorRole(collaboratorId) : null;
  }

  canCollaboratorManageRoles(collaboratorId) {
    return collaboratorId ? checkCollaboratorAccess(collaboratorId, 'assign_roles') : false;
  }

  validateRfiUpdate(entityId, updates, user) {
    if (!user) return { valid: false, error: 'User not authenticated', code: 'NOT_AUTHENTICATED' };
    if (user.role === 'partner' || user.role === 'manager') return { valid: true, canForceStatus: true };
    const rfi = get('rfi', entityId);
    if (!rfi) return { valid: true };
    return this.validateClerkCompletion(rfi, updates, 'Clerks cannot set status to "Completed" without a valid file attachment or response body text', 'CLERK_COMPLETION_VALIDATION_FAILED');
  }

  validateRfiResponseStatusUpdate(rfiResponseId, updates, user) {
    if (!user) return { valid: false, error: 'User not authenticated', code: 'NOT_AUTHENTICATED' };
    if (user.role === 'partner' || user.role === 'manager') return { valid: true, canForceStatus: true };
    const resp = get('rfi_response', rfiResponseId);
    if (!resp) return { valid: true };
    const isStatus = updates.status === 'accepted' || updates.status === 'completed' || updates.is_complete === true;
    if (!isStatus) return { valid: true };
    const files = updates.file_attachments !== undefined ? updates.file_attachments : (resp.file_attachments || []);
    const text = updates.response_text !== undefined ? updates.response_text : (resp.response_text || '');
    if (!(Array.isArray(files) && files.length > 0) && !(text && text.trim().length > 0)) {
      return { valid: false, error: 'Clerks cannot mark response as complete without a valid file attachment or response body text', code: 'CLERK_RESPONSE_COMPLETION_VALIDATION_FAILED' };
    }
    return { valid: true };
  }

  canUploadFile(entityType, entityId, user) {
    if (!user) return { canUpload: false, error: 'User not authenticated' };
    return { canUpload: true };
  }

  validateClerkCompletion(record, updates, errorMsg, code) {
    const isStatus = updates.status === 'completed' || updates.status === 1 || updates.client_status === 'completed' || updates.client_status === 1;
    if (!isStatus) return { valid: true };
    const files = updates.files_count !== undefined ? updates.files_count : (record.files_count || 0);
    const respCount = updates.response_count !== undefined ? updates.response_count : (record.response_count || 0);
    const text = updates.response_text || record.response_text;
    if (files <= 0 && respCount <= 0 && !(text && text.trim().length > 0)) return { valid: false, error: errorMsg, code };
    return { valid: true };
  }

  getRoleLabel(role) { return ROLE_LABELS[role] || role; }
  getAllRoles() { return ROLE_LIST; }
}

export const permissionService = new PermissionService();

export function can(user, spec, action) { return permissionService.can(user, spec, action); }
export function check(user, spec, action) { permissionService.require(user, spec, action); }
export function canAccessRow() { return true; }
export function getAllRoles() { return ROLE_LIST; }
export function getRoleLabel(role) { return ROLE_LABELS[role] || role; }
export function getRoleDescription(role) {
  const desc = { partner: 'Full system access, manage all users and configurations', manager: 'Can manage engagements, reviews, and team members', clerk: 'Can view and create comments, limited to assigned items', client_admin: 'Can manage client users and view client data', client_user: 'Can view data and create comments' };
  return desc[role] || '';
}

export function getPermissionMatrix() {
  return {
    partner: { user: ['list', 'read', 'create', 'update', 'delete'], engagement: ['list', 'read', 'create', 'update', 'delete'], review: ['list', 'read', 'create', 'update', 'delete'], comment: ['list', 'read', 'create', 'update', 'delete'], checklist: ['list', 'read', 'create', 'update', 'delete'], highlight: ['list', 'read', 'create', 'update', 'delete'], client: ['list', 'read', 'create', 'update', 'delete'], team: ['list', 'read', 'create', 'update', 'delete'] },
    manager: { user: ['list', 'read'], engagement: ['list', 'read', 'create', 'update'], review: ['list', 'read', 'create', 'update'], comment: ['list', 'read', 'create', 'update'], checklist: ['list', 'read', 'create', 'update'], highlight: ['list', 'read'], client: ['list', 'read'], team: ['list', 'read'] },
    clerk: { user: [], engagement: ['list', 'read'], review: ['list', 'read'], comment: ['list', 'read', 'create', 'update'], checklist: ['list', 'read', 'create', 'update'], highlight: ['list', 'read'], client: [], team: [] },
    client_admin: { user: [], engagement: ['list', 'read'], review: ['list', 'read'], comment: ['list', 'read', 'create', 'update'], checklist: ['list', 'read'], highlight: ['list', 'read'], client: ['read'], team: [] },
    client_user: { user: [], engagement: ['list', 'read'], review: ['list', 'read'], comment: ['list', 'read', 'create'], checklist: ['list', 'read'], highlight: ['list', 'read'], client: [], team: [] },
  };
}
