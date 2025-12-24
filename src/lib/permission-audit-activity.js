import { create } from '@/lib/query-engine';

export async function createActivityLogForAudit({
  auditId,
  entityType,
  entityId,
  action,
  userId,
  affectedUserId = null,
  reason = null,
  reasonCode = null,
  oldPermissions = null,
  newPermissions = null,
}) {
  const message = generateAuditMessage({
    action,
    entityType,
    entityId,
    affectedUserId,
    reason,
    oldPermissions,
    newPermissions,
  });

  const details = {
    audit_id: auditId,
    action,
    reason_code: reasonCode,
    entity_type: entityType,
    entity_id: entityId,
    affected_user: affectedUserId,
    permission_change: {
      from: oldPermissions,
      to: newPermissions,
    },
  };

  try {
    const activityLog = create('activity_log', {
      entity_type: 'permission_audit',
      entity_id: auditId,
      action: `permission_${action}`,
      message,
      user_id: userId,
      details: JSON.stringify(details),
    });

    return activityLog;
  } catch (error) {
    console.error('[PermissionAuditActivity] Failed to create activity log:', error);
    return null;
  }
}

function generateAuditMessage({
  action,
  entityType,
  entityId,
  affectedUserId,
  reason,
  oldPermissions,
  newPermissions,
}) {
  const entityRef = `${entityType} ${entityId}`;

  switch (action) {
    case 'grant':
      return affectedUserId
        ? `Granted permissions to user ${affectedUserId} for ${entityRef}`
        : `Granted permissions for ${entityRef}`;

    case 'revoke':
      return affectedUserId
        ? `Revoked permissions from user ${affectedUserId} for ${entityRef}`
        : `Revoked permissions for ${entityRef}`;

    case 'modify':
      return affectedUserId
        ? `Modified permissions for user ${affectedUserId} on ${entityRef}`
        : `Modified permissions for ${entityRef}`;

    case 'role_change':
      if (oldPermissions?.role && newPermissions?.role) {
        return `Changed user role from ${oldPermissions.role} to ${newPermissions.role}`;
      }
      return `Changed user role for ${entityRef}`;

    case 'template_applied':
      return `Applied permission template to ${entityRef}`;

    default:
      return reason || `Permission change for ${entityRef}`;
  }
}

export async function getActivityLogsForAudit(auditId) {
  try {
    const { list } = await import('@/lib/query-engine');
    const logs = list('activity_log', {
      entity_type: 'permission_audit',
      entity_id: auditId,
    });

    return logs;
  } catch (error) {
    console.error('[PermissionAuditActivity] Failed to get activity logs:', error);
    return [];
  }
}

export async function getRecentPermissionActivities(limit = 50) {
  try {
    const { getDatabase } = await import('@/lib/database-core');
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT * FROM activity_log
      WHERE entity_type = 'permission_audit'
         OR action LIKE 'permission_%'
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit);

    return rows.map(row => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : null,
    }));
  } catch (error) {
    console.error('[PermissionAuditActivity] Failed to get recent activities:', error);
    return [];
  }
}

export async function linkAuditToActivity(auditId, activityLogId) {
  try {
    const { update } = await import('@/lib/query-engine');

    update('permission_audit', auditId, {
      metadata: JSON.stringify({
        activity_log_id: activityLogId,
        linked_at: Math.floor(Date.now() / 1000),
      }),
    });

    return true;
  } catch (error) {
    console.error('[PermissionAuditActivity] Failed to link audit to activity:', error);
    return false;
  }
}

export function formatPermissionChange(oldPermissions, newPermissions) {
  if (!oldPermissions && !newPermissions) {
    return 'No permission data';
  }

  if (!oldPermissions) {
    return `Added: ${formatPermissions(newPermissions)}`;
  }

  if (!newPermissions) {
    return `Removed: ${formatPermissions(oldPermissions)}`;
  }

  const added = [];
  const removed = [];
  const changed = [];

  const oldKeys = Object.keys(oldPermissions);
  const newKeys = Object.keys(newPermissions);

  const allKeys = new Set([...oldKeys, ...newKeys]);

  allKeys.forEach(key => {
    const oldVal = oldPermissions[key];
    const newVal = newPermissions[key];

    if (oldVal === undefined && newVal !== undefined) {
      added.push(`${key}: ${newVal}`);
    } else if (oldVal !== undefined && newVal === undefined) {
      removed.push(`${key}: ${oldVal}`);
    } else if (oldVal !== newVal) {
      changed.push(`${key}: ${oldVal} → ${newVal}`);
    }
  });

  const parts = [];
  if (added.length) parts.push(`Added: ${added.join(', ')}`);
  if (removed.length) parts.push(`Removed: ${removed.join(', ')}`);
  if (changed.length) parts.push(`Changed: ${changed.join(', ')}`);

  return parts.join(' | ') || 'No changes';
}

function formatPermissions(permissions) {
  if (Array.isArray(permissions)) {
    return permissions.join(', ');
  }

  if (typeof permissions === 'object') {
    return Object.entries(permissions)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
  }

  return String(permissions);
}
