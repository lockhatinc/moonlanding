'use server';

import { permissionAuditService } from '@/services';

export async function auditRoleChange({
  user,
  targetUserId,
  oldRole,
  newRole,
  reason = null,
  metadata = null,
}) {
  try {
    await permissionAuditService.logPermissionChange({
      userId: user.id,
      entityType: 'user',
      entityId: targetUserId,
      action: 'role_change',
      oldPermissions: { role: oldRole },
      newPermissions: { role: newRole },
      reason: reason || `Role changed from ${oldRole} to ${newRole}`,
      reasonCode: 'role_change',
      affectedUserId: targetUserId,
      metadata: {
        ...metadata,
        old_role: oldRole,
        new_role: newRole,
      },
    });
  } catch (error) {
    console.error('[PermissionAuditHook] Failed to log role change:', error);
  }
}

export async function auditCollaboratorAdded({
  user,
  reviewId,
  collaboratorId,
  collaboratorUserId,
  permissions = null,
  reason = null,
  metadata = null,
}) {
  try {
    await permissionAuditService.logPermissionChange({
      userId: user.id,
      entityType: 'review',
      entityId: reviewId,
      action: 'grant',
      oldPermissions: null,
      newPermissions: permissions || { access: 'collaborator' },
      reason: reason || `Collaborator added to review`,
      reasonCode: 'collaborator_added',
      affectedUserId: collaboratorUserId,
      metadata: {
        ...metadata,
        collaborator_id: collaboratorId,
        review_id: reviewId,
      },
    });
  } catch (error) {
    console.error('[PermissionAuditHook] Failed to log collaborator added:', error);
  }
}

export async function auditCollaboratorRemoved({
  user,
  reviewId,
  collaboratorId,
  collaboratorUserId,
  permissions = null,
  reason = null,
  metadata = null,
}) {
  try {
    await permissionAuditService.logPermissionChange({
      userId: user.id,
      entityType: 'review',
      entityId: reviewId,
      action: 'revoke',
      oldPermissions: permissions || { access: 'collaborator' },
      newPermissions: null,
      reason: reason || `Collaborator removed from review`,
      reasonCode: 'collaborator_removed',
      affectedUserId: collaboratorUserId,
      metadata: {
        ...metadata,
        collaborator_id: collaboratorId,
        review_id: reviewId,
      },
    });
  } catch (error) {
    console.error('[PermissionAuditHook] Failed to log collaborator removed:', error);
  }
}

export async function auditTeamAssignment({
  user,
  entityType,
  entityId,
  oldTeamId = null,
  newTeamId,
  affectedUserId = null,
  reason = null,
  metadata = null,
}) {
  try {
    await permissionAuditService.logPermissionChange({
      userId: user.id,
      entityType,
      entityId,
      action: 'modify',
      oldPermissions: oldTeamId ? { team_id: oldTeamId } : null,
      newPermissions: { team_id: newTeamId },
      reason: reason || `Team assignment changed`,
      reasonCode: 'team_assignment',
      affectedUserId,
      metadata: {
        ...metadata,
        old_team_id: oldTeamId,
        new_team_id: newTeamId,
      },
    });
  } catch (error) {
    console.error('[PermissionAuditHook] Failed to log team assignment:', error);
  }
}

export async function auditPermissionTemplateApplied({
  user,
  entityType,
  entityId,
  templateName,
  permissions,
  reason = null,
  metadata = null,
}) {
  try {
    await permissionAuditService.logPermissionChange({
      userId: user.id,
      entityType,
      entityId,
      action: 'template_applied',
      oldPermissions: null,
      newPermissions: permissions,
      reason: reason || `Permission template '${templateName}' applied`,
      reasonCode: 'admin_action',
      metadata: {
        ...metadata,
        template_name: templateName,
      },
    });
  } catch (error) {
    console.error('[PermissionAuditHook] Failed to log template application:', error);
  }
}

export async function auditPermissionGrant({
  user,
  entityType,
  entityId,
  oldPermissions = null,
  newPermissions,
  affectedUserId = null,
  reason = null,
  reasonCode = 'admin_action',
  metadata = null,
}) {
  try {
    await permissionAuditService.logPermissionChange({
      userId: user.id,
      entityType,
      entityId,
      action: 'grant',
      oldPermissions,
      newPermissions,
      reason: reason || `Permissions granted`,
      reasonCode,
      affectedUserId,
      metadata,
    });
  } catch (error) {
    console.error('[PermissionAuditHook] Failed to log permission grant:', error);
  }
}

export async function auditPermissionRevoke({
  user,
  entityType,
  entityId,
  oldPermissions,
  newPermissions = null,
  affectedUserId = null,
  reason = null,
  reasonCode = 'admin_action',
  metadata = null,
}) {
  try {
    await permissionAuditService.logPermissionChange({
      userId: user.id,
      entityType,
      entityId,
      action: 'revoke',
      oldPermissions,
      newPermissions,
      reason: reason || `Permissions revoked`,
      reasonCode,
      affectedUserId,
      metadata,
    });
  } catch (error) {
    console.error('[PermissionAuditHook] Failed to log permission revoke:', error);
  }
}

export async function auditPermissionModify({
  user,
  entityType,
  entityId,
  oldPermissions,
  newPermissions,
  affectedUserId = null,
  reason = null,
  reasonCode = 'admin_action',
  metadata = null,
}) {
  try {
    await permissionAuditService.logPermissionChange({
      userId: user.id,
      entityType,
      entityId,
      action: 'modify',
      oldPermissions,
      newPermissions,
      reason: reason || `Permissions modified`,
      reasonCode,
      affectedUserId,
      metadata,
    });
  } catch (error) {
    console.error('[PermissionAuditHook] Failed to log permission modify:', error);
  }
}

export async function auditLifecycleTransition({
  user,
  entityType,
  entityId,
  fromStage,
  toStage,
  oldPermissions = null,
  newPermissions = null,
  metadata = null,
}) {
  try {
    await permissionAuditService.logPermissionChange({
      userId: user.id,
      entityType,
      entityId,
      action: 'modify',
      oldPermissions: oldPermissions || { stage: fromStage },
      newPermissions: newPermissions || { stage: toStage },
      reason: `Lifecycle transition: ${fromStage} → ${toStage}`,
      reasonCode: 'lifecycle_transition',
      metadata: {
        ...metadata,
        from_stage: fromStage,
        to_stage: toStage,
      },
    });
  } catch (error) {
    console.error('[PermissionAuditHook] Failed to log lifecycle transition:', error);
  }
}

export async function auditUserRequest({
  user,
  entityType,
  entityId,
  action,
  oldPermissions = null,
  newPermissions = null,
  affectedUserId = null,
  reason = null,
  metadata = null,
}) {
  try {
    await permissionAuditService.logPermissionChange({
      userId: user.id,
      entityType,
      entityId,
      action,
      oldPermissions,
      newPermissions,
      reason: reason || `User-requested permission change`,
      reasonCode: 'user_request',
      affectedUserId,
      metadata,
    });
  } catch (error) {
    console.error('[PermissionAuditHook] Failed to log user request:', error);
  }
}
