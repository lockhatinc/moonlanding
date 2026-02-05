import { list, get, update, create } from '@/engine';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/constants';

const COLLABORATOR_ROLE_PERMISSIONS = {
  viewer: ['view', 'view_highlights', 'view_pdfs'],
  commenter: ['view', 'view_highlights', 'view_pdfs', 'add_notes', 'add_comments'],
  reviewer: ['view', 'view_highlights', 'view_pdfs', 'add_notes', 'add_comments', 'edit_highlights', 'resolve_highlights', 'create_highlights', 'delete_own_highlights'],
  manager: ['view', 'view_highlights', 'view_pdfs', 'add_notes', 'add_comments', 'edit_highlights', 'resolve_highlights', 'create_highlights', 'delete_highlights', 'manage_collaborators', 'assign_roles', 'approve_changes']
};

export function getCollaboratorRole(collaboratorId) {
  if (!collaboratorId) return null;
  const collaborator = get('collaborator', collaboratorId);
  if (!collaborator) return null;
  if (collaborator.primary_role_id) {
    const role = get('collaborator_role', collaborator.primary_role_id);
    if (role && role.is_active) return role;
  }
  const roles = list('collaborator_role').filter(r => r.collaborator_id === collaboratorId && r.is_active);
  if (roles.length === 0) return null;
  roles.sort((a, b) => b.assigned_at - a.assigned_at);
  const activeRole = roles[0];
  if (collaborator.primary_role_id !== activeRole.id) {
    update('collaborator', collaboratorId, { primary_role_id: activeRole.id, is_manager: activeRole.role_type === 'manager' });
  }
  return activeRole;
}

export function checkCollaboratorAccess(collaboratorId, action, record = null) {
  const role = getCollaboratorRole(collaboratorId);
  if (!role) return false;
  const perms = COLLABORATOR_ROLE_PERMISSIONS[role.role_type];
  if (!perms) return false;
  if (perms.includes(action)) return true;
  if (action === 'delete_highlights' && perms.includes('delete_own_highlights') && record) {
    const collaborator = get('collaborator', collaboratorId);
    return record.created_by === collaborator?.user_id;
  }
  return false;
}

export function hasCollaboratorPermission(collaboratorId, permission) {
  const role = getCollaboratorRole(collaboratorId);
  if (!role) return false;
  const perms = COLLABORATOR_ROLE_PERMISSIONS[role.role_type];
  return perms ? perms.includes(permission) : false;
}

export function getCollaboratorRoleHistory(collaboratorId) {
  if (!collaboratorId) return [];
  return list('collaborator_role').filter(r => r.collaborator_id === collaboratorId).sort((a, b) => b.assigned_at - a.assigned_at);
}

export async function assignCollaboratorRole(collaboratorId, roleType, assignedBy, roleDescription = null) {
  const collaborator = get('collaborator', collaboratorId);
  if (!collaborator) throw new AppError('Collaborator not found', 'NOT_FOUND', HTTP.NOT_FOUND);
  if (!['viewer', 'commenter', 'reviewer', 'manager'].includes(roleType)) throw new AppError('Invalid role type', 'VALIDATION_ERROR', HTTP.BAD_REQUEST);
  const currentRole = getCollaboratorRole(collaboratorId);
  if (currentRole) update('collaborator_role', currentRole.id, { is_active: false, superseded_at: Math.floor(Date.now() / 1000) });
  const nowSeconds = Math.floor(Date.now() / 1000);
  const newRole = create('collaborator_role', { collaborator_id: collaboratorId, role_type: roleType, assigned_by: assignedBy, assigned_at: nowSeconds, role_description: roleDescription, is_active: true, created_at: nowSeconds, updated_at: nowSeconds, created_by: assignedBy, updated_by: assignedBy });
  if (currentRole) update('collaborator_role', currentRole.id, { superseded_by: newRole.id });
  update('collaborator', collaboratorId, { primary_role_id: newRole.id, is_manager: roleType === 'manager', updated_at: nowSeconds });
  create('activity_log', { entity_type: 'collaborator_role', entity_id: newRole.id, action: 'role_assigned', message: currentRole ? `Role changed from ${currentRole.role_type} to ${roleType}` : `Role assigned: ${roleType}`, details: JSON.stringify({ collaborator_id: collaboratorId, old_role: currentRole?.role_type || null, new_role: roleType, assigned_by: assignedBy, role_description: roleDescription }) });
  return newRole;
}

export function getCollaboratorRolePermissions(roleType) {
  return COLLABORATOR_ROLE_PERMISSIONS[roleType] || [];
}

export function canAssignRole(userRole, targetRoleType) {
  return ['partner', 'manager'].includes(userRole);
}

export function addCollaborator(reviewId, email, options = {}) {
  const { expiresAt, createdBy = 'system', reason = '' } = options;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const isPermanent = !expiresAt;
  if (expiresAt) {
    const maxAllowed = nowSeconds + (30 * 24 * 60 * 60);
    if (expiresAt <= nowSeconds) throw new Error('Expiry date must be in the future');
    if (expiresAt > maxAllowed) throw new Error('Expiry date cannot exceed 30 days from now');
  }
  return create('collaborator', { review_id: reviewId, email, expires_at: expiresAt || null, is_permanent: isPermanent, created_at: nowSeconds, created_by: createdBy, reason, access_type: isPermanent ? 'permanent' : 'temporary' }, { id: createdBy, role: 'partner' });
}

export function getReviewCollaborators(reviewId) {
  const collaborators = list('collaborator', { review_id: reviewId });
  const nowSeconds = Math.floor(Date.now() / 1000);
  return collaborators.map(c => ({
    id: c.id, email: c.email, accessType: c.access_type, isPermanent: c.is_permanent,
    expiresAt: c.expires_at, daysUntilExpiry: c.expires_at ? Math.ceil((c.expires_at - nowSeconds) / 86400) : null,
    isExpired: !c.is_permanent && c.expires_at && c.expires_at <= nowSeconds,
    createdAt: c.created_at, createdBy: c.created_by
  }));
}

export function revokeCollaborator(collaboratorId, reason = 'manual_revoke', revokedBy = 'system') {
  const collaborator = get('collaborator', collaboratorId);
  if (!collaborator) throw new Error('Collaborator not found');
  update('collaborator', collaboratorId, { revoked_at: Math.floor(Date.now() / 1000), revoked_by: revokedBy, revocation_reason: reason, access_type: 'revoked' }, { id: revokedBy, role: 'partner' });
  return true;
}
