import { getDatabase } from '@/lib/database-core';
import { createErrorLogger, DatabaseError } from '@/lib/error-handler';
import { LOG_PREFIXES } from '@/config';

const db = getDatabase();
const logger = createErrorLogger(LOG_PREFIXES.database);

export const execQuery = (sql, params, context = {}) => {
  try {
    return db.prepare(sql).all(...params);
  } catch (e) {
    logger.error(`${context.operation || 'Query'} ${context.entity || ''}`, { sql, error: e.message });
    throw DatabaseError(`query ${context.entity || 'database'}`, e);
  }
};

export const execGet = (sql, params, context = {}) => {
  try {
    return db.prepare(sql).get(...params);
  } catch (e) {
    logger.error(`${context.operation || 'Get'} ${context.entity || ''}`, { sql, error: e.message });
    throw DatabaseError(`get ${context.entity || 'record'}`, e);
  }
};

export const execRun = (sql, params, context = {}) => {
  try {
    return db.prepare(sql).run(...params);
  } catch (e) {
    logger.error(`${context.operation || 'Run'} ${context.entity || ''}`, { sql, error: e.message });
    throw DatabaseError(`execute ${context.entity || 'operation'}`, e);
  }
};

export const withTransaction = async (callback) => {
  try {
    db.prepare('BEGIN').run();
    const result = await callback();
    db.prepare('COMMIT').run();
    return result;
  } catch (e) {
    db.prepare('ROLLBACK').run();
    throw e;
  }
};
