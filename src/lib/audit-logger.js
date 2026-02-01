import { getDatabase, genId, now } from '@/lib/database-core';

export const logAction = (entityType, entityId, action, userId, beforeState, afterState) => {
  const db = getDatabase();
  const id = genId();
  const timestamp = now();

  const beforeJson = beforeState ? JSON.stringify(beforeState) : null;
  const afterJson = afterState ? JSON.stringify(afterState) : null;

  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      id, entity_type, entity_id, action, user_id,
      before_state, after_state, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    entityType,
    entityId,
    action,
    userId || null,
    beforeJson,
    afterJson,
    timestamp
  );

  return { id, timestamp };
};

export const getAuditHistory = (filters = {}, page = 1, pageSize = 50) => {
  const db = getDatabase();

  let whereConditions = [];
  let params = [];

  if (filters.entityType) {
    whereConditions.push('entity_type = ?');
    params.push(filters.entityType);
  }

  if (filters.entityId) {
    whereConditions.push('entity_id = ?');
    params.push(filters.entityId);
  }

  if (filters.userId) {
    whereConditions.push('user_id = ?');
    params.push(filters.userId);
  }

  if (filters.action) {
    whereConditions.push('action = ?');
    params.push(filters.action);
  }

  if (filters.fromDate) {
    whereConditions.push('created_at >= ?');
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    whereConditions.push('created_at <= ?');
    params.push(filters.toDate);
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`);
  const { count } = countStmt.get(...params);

  const offset = (page - 1) * pageSize;
  const stmt = db.prepare(`
    SELECT id, entity_type, entity_id, action, user_id,
           before_state, after_state, created_at
    FROM audit_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);

  const items = stmt.all(...params, pageSize, offset);

  const logs = items.map(item => ({
    id: item.id,
    entityType: item.entity_type,
    entityId: item.entity_id,
    action: item.action,
    userId: item.user_id,
    beforeState: item.before_state ? JSON.parse(item.before_state) : null,
    afterState: item.after_state ? JSON.parse(item.after_state) : null,
    createdAt: item.created_at
  }));

  return {
    items: logs,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  };
};

export const getEntityAuditTrail = (entityType, entityId) => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, action, user_id, before_state, after_state, created_at
    FROM audit_logs
    WHERE entity_type = ? AND entity_id = ?
    ORDER BY created_at DESC
  `);

  const items = stmt.all(entityType, entityId);

  return items.map(item => ({
    id: item.id,
    action: item.action,
    userId: item.user_id,
    beforeState: item.before_state ? JSON.parse(item.before_state) : null,
    afterState: item.after_state ? JSON.parse(item.after_state) : null,
    createdAt: item.created_at
  }));
};

export const getActionStats = (fromDate, toDate) => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT action, COUNT(*) as count
    FROM audit_logs
    WHERE created_at >= ? AND created_at <= ?
    GROUP BY action
    ORDER BY count DESC
  `);

  return stmt.all(fromDate, toDate);
};

export const getUserStats = (fromDate, toDate) => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT user_id, COUNT(*) as count
    FROM audit_logs
    WHERE created_at >= ? AND created_at <= ?
    GROUP BY user_id
    ORDER BY count DESC
  `);

  return stmt.all(fromDate, toDate);
};
