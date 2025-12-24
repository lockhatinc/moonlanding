import { list, get, update, create } from '@/engine';
import { getConfigEngine } from '@/lib/config-generator-engine';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';

const COLLABORATOR_ROLE_PERMISSIONS = {
  viewer: ['view', 'view_highlights', 'view_pdfs'],
  commenter: ['view', 'view_highlights', 'view_pdfs', 'add_notes', 'add_comments'],
  reviewer: [
    'view',
    'view_highlights',
    'view_pdfs',
    'add_notes',
    'add_comments',
    'edit_highlights',
    'resolve_highlights',
    'create_highlights',
    'delete_own_highlights'
  ],
  manager: [
    'view',
    'view_highlights',
    'view_pdfs',
    'add_notes',
    'add_comments',
    'edit_highlights',
    'resolve_highlights',
    'create_highlights',
    'delete_highlights',
    'manage_collaborators',
    'assign_roles',
    'approve_changes'
  ]
};

export function getCollaboratorRole(collaboratorId) {
  if (!collaboratorId) {
    return null;
  }

  const collaborator = get('collaborator', collaboratorId);
  if (!collaborator) {
    return null;
  }

  if (collaborator.primary_role_id) {
    const role = get('collaborator_role', collaborator.primary_role_id);
    if (role && role.is_active) {
      return role;
    }
  }

  const roles = list('collaborator_role').filter(
    r => r.collaborator_id === collaboratorId && r.is_active
  );

  if (roles.length === 0) {
    return null;
  }

  roles.sort((a, b) => b.assigned_at - a.assigned_at);

  const activeRole = roles[0];

  if (collaborator.primary_role_id !== activeRole.id) {
    update('collaborator', collaboratorId, {
      primary_role_id: activeRole.id,
      is_manager: activeRole.role_type === 'manager'
    });
  }

  return activeRole;
}

export function getCollaboratorRoleHistory(collaboratorId) {
  if (!collaboratorId) {
    return [];
  }

  const roles = list('collaborator_role').filter(
    r => r.collaborator_id === collaboratorId
  );

  return roles.sort((a, b) => b.assigned_at - a.assigned_at);
}

export function hasCollaboratorPermission(collaboratorId, permission) {
  const role = getCollaboratorRole(collaboratorId);

  if (!role) {
    return false;
  }

  const permissions = COLLABORATOR_ROLE_PERMISSIONS[role.role_type];
  return permissions ? permissions.includes(permission) : false;
}

export function checkCollaboratorAccess(collaboratorId, action, record = null) {
  const role = getCollaboratorRole(collaboratorId);

  if (!role) {
    return false;
  }

  const permissions = COLLABORATOR_ROLE_PERMISSIONS[role.role_type];

  if (!permissions) {
    return false;
  }

  if (action === 'view' && permissions.includes('view')) {
    return true;
  }

  if (action === 'view_highlights' && permissions.includes('view_highlights')) {
    return true;
  }

  if (action === 'view_pdfs' && permissions.includes('view_pdfs')) {
    return true;
  }

  if (action === 'add_notes' && permissions.includes('add_notes')) {
    return true;
  }

  if (action === 'add_comments' && permissions.includes('add_comments')) {
    return true;
  }

  if (action === 'create_highlights' && permissions.includes('create_highlights')) {
    return true;
  }

  if (action === 'edit_highlights' && permissions.includes('edit_highlights')) {
    return true;
  }

  if (action === 'resolve_highlights' && permissions.includes('resolve_highlights')) {
    return true;
  }

  if (action === 'delete_highlights') {
    if (permissions.includes('delete_highlights')) {
      return true;
    }

    if (permissions.includes('delete_own_highlights') && record) {
      const collaborator = get('collaborator', collaboratorId);
      return record.created_by === collaborator?.user_id;
    }
  }

  if (action === 'manage_collaborators' && permissions.includes('manage_collaborators')) {
    return true;
  }

  if (action === 'assign_roles' && permissions.includes('assign_roles')) {
    return true;
  }

  if (action === 'approve_changes' && permissions.includes('approve_changes')) {
    return true;
  }

  return false;
}

export async function assignCollaboratorRole(collaboratorId, roleType, assignedBy, roleDescription = null) {
  const collaborator = get('collaborator', collaboratorId);

  if (!collaborator) {
    throw new AppError('Collaborator not found', 'NOT_FOUND', HTTP.NOT_FOUND);
  }

  if (!['viewer', 'commenter', 'reviewer', 'manager'].includes(roleType)) {
    throw new AppError('Invalid role type', 'VALIDATION_ERROR', HTTP.BAD_REQUEST);
  }

  const currentRole = getCollaboratorRole(collaboratorId);

  if (currentRole) {
    update('collaborator_role', currentRole.id, {
      is_active: false,
      superseded_at: Math.floor(Date.now() / 1000)
    });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  const newRole = create('collaborator_role', {
    collaborator_id: collaboratorId,
    role_type: roleType,
    assigned_by: assignedBy,
    assigned_at: nowSeconds,
    role_description: roleDescription,
    is_active: true,
    created_at: nowSeconds,
    updated_at: nowSeconds,
    created_by: assignedBy,
    updated_by: assignedBy
  });

  if (currentRole) {
    update('collaborator_role', currentRole.id, {
      superseded_by: newRole.id
    });
  }

  update('collaborator', collaboratorId, {
    primary_role_id: newRole.id,
    is_manager: roleType === 'manager',
    updated_at: nowSeconds
  });

  create('activity_log', {
    entity_type: 'collaborator_role',
    entity_id: newRole.id,
    action: 'role_assigned',
    message: currentRole
      ? `Role changed from ${currentRole.role_type} to ${roleType}`
      : `Role assigned: ${roleType}`,
    details: JSON.stringify({
      collaborator_id: collaboratorId,
      old_role: currentRole?.role_type || null,
      new_role: roleType,
      assigned_by: assignedBy,
      role_description: roleDescription
    })
  });

  return newRole;
}

export function getCollaboratorRolePermissions(roleType) {
  return COLLABORATOR_ROLE_PERMISSIONS[roleType] || [];
}

export function canAssignRole(userRole, targetRoleType) {
  if (targetRoleType === 'manager') {
    return ['partner', 'manager'].includes(userRole);
  }

  return ['partner', 'manager'].includes(userRole);
}
