import { getDatabase, genId, now } from '@/lib/database-core';
import { createActivityLogForAudit } from '@/lib/permission-audit-activity';

class PermissionAuditService {
  constructor() {
    this.db = getDatabase();
  }

  async logPermissionChange({
    userId,
    entityType,
    entityId,
    action,
    oldPermissions = null,
    newPermissions = null,
    reason = null,
    reasonCode = 'other',
    affectedUserId = null,
    ipAddress = null,
    sessionId = null,
    metadata = null,
  }) {
    if (!userId || !entityType || !entityId || !action) {
      throw new Error('Missing required audit fields: userId, entityType, entityId, action');
    }

    const validActions = ['grant', 'revoke', 'modify', 'role_change', 'template_applied'];
    if (!validActions.includes(action)) {
      throw new Error(`Invalid action: ${action}. Must be one of: ${validActions.join(', ')}`);
    }

    const validReasonCodes = [
      'user_request',
      'lifecycle_transition',
      'role_change',
      'admin_action',
      'collaborator_added',
      'collaborator_removed',
      'team_assignment',
      'other',
    ];
    if (!validReasonCodes.includes(reasonCode)) {
      throw new Error(`Invalid reason_code: ${reasonCode}`);
    }

    const auditId = genId();
    const timestamp = now();

    const stmt = this.db.prepare(`
      INSERT INTO permission_audit (
        id, user_id, entity_type, entity_id, action,
        old_permissions, new_permissions, reason, reason_code,
        timestamp, ip_address, session_id, affected_user_id, metadata,
        created_at, updated_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        auditId,
        userId,
        entityType,
        entityId,
        action,
        oldPermissions ? JSON.stringify(oldPermissions) : null,
        newPermissions ? JSON.stringify(newPermissions) : null,
        reason,
        reasonCode,
        timestamp,
        ipAddress,
        sessionId,
        affectedUserId,
        metadata ? JSON.stringify(metadata) : null,
        timestamp,
        timestamp,
        userId,
        userId
      );

      await createActivityLogForAudit({
        auditId,
        entityType,
        entityId,
        action,
        userId,
        affectedUserId,
        reason,
        reasonCode,
        oldPermissions,
        newPermissions,
      });

      return auditId;
    } catch (error) {
      console.error('[PermissionAudit] Failed to log permission change:', error);
      throw error;
    }
  }

  async getAuditTrail({ entityType, entityId, userId, affectedUserId, limit = 100, offset = 0 }) {
    let sql = 'SELECT * FROM permission_audit WHERE 1=1';
    const params = [];

    if (entityType) {
      sql += ' AND entity_type = ?';
      params.push(entityType);
    }

    if (entityId) {
      sql += ' AND entity_id = ?';
      params.push(entityId);
    }

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    if (affectedUserId) {
      sql += ' AND affected_user_id = ?';
      params.push(affectedUserId);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);

    return rows.map(row => ({
      ...row,
      old_permissions: row.old_permissions ? JSON.parse(row.old_permissions) : null,
      new_permissions: row.new_permissions ? JSON.parse(row.new_permissions) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  async getRecentChanges(limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM permission_audit
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit);

    return rows.map(row => ({
      ...row,
      old_permissions: row.old_permissions ? JSON.parse(row.old_permissions) : null,
      new_permissions: row.new_permissions ? JSON.parse(row.new_permissions) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  async getAuditById(auditId) {
    const stmt = this.db.prepare('SELECT * FROM permission_audit WHERE id = ?');
    const row = stmt.get(auditId);

    if (!row) return null;

    return {
      ...row,
      old_permissions: row.old_permissions ? JSON.parse(row.old_permissions) : null,
      new_permissions: row.new_permissions ? JSON.parse(row.new_permissions) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  async getChangesByDateRange(startDate, endDate, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM permission_audit
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(startDate, endDate, limit);

    return rows.map(row => ({
      ...row,
      old_permissions: row.old_permissions ? JSON.parse(row.old_permissions) : null,
      new_permissions: row.new_permissions ? JSON.parse(row.new_permissions) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  async getChangesByAction(action, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM permission_audit
      WHERE action = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(action, limit);

    return rows.map(row => ({
      ...row,
      old_permissions: row.old_permissions ? JSON.parse(row.old_permissions) : null,
      new_permissions: row.new_permissions ? JSON.parse(row.new_permissions) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  async getChangesByReasonCode(reasonCode, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM permission_audit
      WHERE reason_code = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(reasonCode, limit);

    return rows.map(row => ({
      ...row,
      old_permissions: row.old_permissions ? JSON.parse(row.old_permissions) : null,
      new_permissions: row.new_permissions ? JSON.parse(row.new_permissions) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  async searchAuditTrail(searchTerm, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM permission_audit
      WHERE reason LIKE ?
         OR entity_type LIKE ?
         OR entity_id LIKE ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const searchPattern = `%${searchTerm}%`;
    const rows = stmt.all(searchPattern, searchPattern, searchPattern, limit);

    return rows.map(row => ({
      ...row,
      old_permissions: row.old_permissions ? JSON.parse(row.old_permissions) : null,
      new_permissions: row.new_permissions ? JSON.parse(row.new_permissions) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  async exportToCSV(filters = {}) {
    const trail = await this.getAuditTrail({ ...filters, limit: 10000 });

    const headers = [
      'Timestamp',
      'Changed By',
      'Entity Type',
      'Entity ID',
      'Action',
      'Reason Code',
      'Reason',
      'Affected User',
      'IP Address',
    ];

    const rows = trail.map(audit => [
      new Date(audit.timestamp * 1000).toISOString(),
      audit.user_id,
      audit.entity_type,
      audit.entity_id,
      audit.action,
      audit.reason_code,
      audit.reason || '',
      audit.affected_user_id || '',
      audit.ip_address || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  async getAuditStats() {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_audits,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT entity_type) as entity_types,
        MIN(timestamp) as earliest_change,
        MAX(timestamp) as latest_change
      FROM permission_audit
    `);

    return stmt.get();
  }

  async getActionBreakdown() {
    const stmt = this.db.prepare(`
      SELECT action, COUNT(*) as count
      FROM permission_audit
      GROUP BY action
      ORDER BY count DESC
    `);

    return stmt.all();
  }

  async getReasonCodeBreakdown() {
    const stmt = this.db.prepare(`
      SELECT reason_code, COUNT(*) as count
      FROM permission_audit
      GROUP BY reason_code
      ORDER BY count DESC
    `);

    return stmt.all();
  }

  getPermissionDiff(oldPermissions, newPermissions) {
    const diff = {
      added: [],
      removed: [],
      unchanged: [],
    };

    const oldSet = new Set(Array.isArray(oldPermissions) ? oldPermissions : []);
    const newSet = new Set(Array.isArray(newPermissions) ? newPermissions : []);

    for (const perm of newSet) {
      if (!oldSet.has(perm)) {
        diff.added.push(perm);
      } else {
        diff.unchanged.push(perm);
      }
    }

    for (const perm of oldSet) {
      if (!newSet.has(perm)) {
        diff.removed.push(perm);
      }
    }

    return diff;
  }
}

export const permissionAuditService = new PermissionAuditService();
