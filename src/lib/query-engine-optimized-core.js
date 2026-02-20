import { getDatabase, now } from '@/lib/database-core';
import { getSpec } from '@/config/spec-helpers';
import { RECORD_STATUS } from '@/config/constants';
import { createErrorLogger, DatabaseError } from '@/lib/error-handler';
import { LOG_PREFIXES } from '@/config';
import { prepareStmt, getCached, setCached, invalidate, cacheQuery } from '@/lib/query-cache';
import { withPerfTracking } from '@/lib/query-perf';

const db = getDatabase();
const logger = createErrorLogger(LOG_PREFIXES.database);

export const execQuery = (sql, params, context = {}) => {
  return withPerfTracking(db, sql, params, () => {
    try {
      return prepareStmt(db, sql).all(...params);
    } catch (e) {
      logger.error(`${context.operation || 'Query'} ${context.entity || ''}`, { sql, error: e.message });
      throw DatabaseError(`query ${context.entity || 'database'}`, e);
    }
  });
};

export const execGet = (sql, params, context = {}) => {
  return withPerfTracking(db, sql, params, () => {
    try {
      return prepareStmt(db, sql).get(...params);
    } catch (e) {
      logger.error(`${context.operation || 'Get'} ${context.entity || ''}`, { sql, error: e.message });
      throw DatabaseError(`get ${context.entity || 'record'}`, e);
    }
  });
};

export const execRun = (sql, params, context = {}) => {
  return withPerfTracking(db, sql, params, () => {
    try {
      invalidate(context.entity);
      return prepareStmt(db, sql).run(...params);
    } catch (e) {
      logger.error(`${context.operation || 'Run'} ${context.entity || ''}`, { sql, error: e.message });
      throw DatabaseError(`execute ${context.entity || 'operation'}`, e);
    }
  });
};

export const withTransaction = async (callback) => {
  try {
    prepareStmt(db, 'BEGIN').run();
    const result = await callback();
    prepareStmt(db, 'COMMIT').run();
    invalidate();
    return result;
  } catch (e) {
    prepareStmt(db, 'ROLLBACK').run();
    throw e;
  }
};

export async function getPaginationConfig() {
  try {
    const { getConfigEngine } = await import('@/lib/config-generator-engine');
    const engine = await getConfigEngine();
    return engine.getConfig().system.pagination;
  } catch (error) {
    return { default_page_size: 50, max_page_size: 500 };
  }
}

export const tableName = (spec) => spec.name === 'user' ? 'users' : spec.name;

export function buildSpecQuery(spec, where = {}, options = {}) {
  const cacheKey = JSON.stringify({ spec: spec.name, where, options });
  return cacheQuery(cacheKey, () => {
    const tbl = tableName(spec);
    const table = `"${tbl}"`, selects = [`${table}.*`], joins = [];
    if (spec.computed) Object.entries(spec.computed).forEach(([k, c]) => selects.push(`${c.sql} as "${k}"`));
    Object.entries(spec.fields).forEach(([k, f]) => {
      if (f.type === 'ref' && f.display) {
        const refTbl = f.ref === 'user' ? 'users' : f.ref;
        const a = `"${refTbl}_${k}"`;
        joins.push(`LEFT JOIN "${refTbl}" ${a} ON ${table}."${k}" = ${a}.id`);
        selects.push(`${a}."${f.display.split('.')[1] || 'name'}" as "${k}_display"`);
      }
    });
    const wc = [], p = [];
    Object.entries(where).forEach(([k, v]) => { if (v !== undefined && v !== null) { wc.push(`${table}."${k}" = ?`); p.push(v); } });
    if (spec.fields.status && !where.status && !options.includeDeleted) wc.push(`${table}."status" != '${RECORD_STATUS.DELETED}'`);
    if (spec.fields.archived && !where.archived && !options.includeArchived) wc.push(`${table}."archived" = 0`);
    let sql = `SELECT ${selects.join(', ')} FROM ${table}`;
    if (joins.length) sql += ' ' + joins.join(' ');
    if (wc.length) sql += ` WHERE ` + wc.join(` AND `);
    const sort = options.sort || spec.list?.defaultSort;
    if (sort && sort.field && spec.fields[sort.field]) {
      const dir = (sort.dir || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      sql += ` ORDER BY ${table}."${sort.field}" ${dir}`;
    }
    if (options.limit) { sql += ` LIMIT ${parseInt(options.limit, 10)}`; if (options.offset) sql += ` OFFSET ${parseInt(options.offset, 10)}`; }
    return { sql, params: p };
  });
}

export async function parsePagination(spec, page, pageSize) {
  const paginationCfg = await getPaginationConfig();
  const defaultPageSize = spec.list?.pageSize || paginationCfg.default_page_size;
  const maxPageSize = paginationCfg.max_page_size;
  const parsedPageSize = pageSize ? parseInt(pageSize, 10) : null;
  const parsedPage = parseInt(page, 10);
  const finalPageSize = parsedPageSize && !isNaN(parsedPageSize) ? Math.min(parsedPageSize, maxPageSize) : defaultPageSize;
  const finalPage = !isNaN(parsedPage) ? Math.max(1, parsedPage) : 1;
  return { finalPage, finalPageSize };
}

export function buildCountWhere(tbl, spec, where) {
  const wc = [], p = [];
  Object.entries(where).forEach(([k, v]) => { if (v !== undefined && v !== null) { wc.push(`"${tbl}"."${k}"=?`); p.push(v); } });
  if (spec.fields.status && !where.status) wc.push(`"${tbl}"."status"!='${RECORD_STATUS.DELETED}'`);
  if (spec.fields.archived && !where.archived) wc.push(`"${tbl}"."archived"=0`);
  return { wc, p };
}

export function paginationResult(items, finalPage, finalPageSize, total) {
  const totalPages = Math.ceil(total / finalPageSize);
  return { items, pagination: { page: finalPage, pageSize: finalPageSize, total, totalPages, hasMore: finalPage < totalPages } };
}

export { getCached, setCached, invalidate, getSpec, RECORD_STATUS };
