import { getDatabase, genId, now } from '@/lib/database-core';
import { getSpec } from '@/config/spec-helpers';
import { RECORD_STATUS } from '@/config/constants';
import { iterateCreateFields, iterateUpdateFields } from '@/lib/field-iterator';
import { coerceFieldValue } from '@/lib/field-registry';
import { createErrorLogger, DatabaseError } from '@/lib/error-handler';
import { LOG_PREFIXES } from '@/config';

const db = getDatabase();
const logger = createErrorLogger(LOG_PREFIXES.database);

const execQuery = (sql, params, context = {}) => {
  try {
    return db.prepare(sql).all(...params);
  } catch (e) {
    logger.error(`${context.operation || 'Query'} ${context.entity || ''}`, { sql, error: e.message });
    throw DatabaseError(`query ${context.entity || 'database'}`, e);
  }
};

const execGet = (sql, params, context = {}) => {
  try {
    return db.prepare(sql).get(...params);
  } catch (e) {
    logger.error(`${context.operation || 'Get'} ${context.entity || ''}`, { sql, error: e.message });
    throw DatabaseError(`get ${context.entity || 'record'}`, e);
  }
};

const execRun = (sql, params, context = {}) => {
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

async function getPaginationConfig() {
  try {
    const { getConfigEngine } = await import('@/lib/config-generator-engine');
    const engine = await getConfigEngine();
    return engine.getConfig().system.pagination;
  } catch (error) {
    return { default_page_size: 50, max_page_size: 500 };
  }
}

const tableName = (spec) => spec.name === 'user' ? 'users' : spec.name;

function buildSpecQuery(spec, where = {}, options = {}) {
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
}

export const list = (entity, where = {}, opts = {}) => {
  const spec = getSpec(entity);
  const { sql, params } = buildSpecQuery(spec, where, opts);
  return execQuery(sql, params, { entity, operation: 'List' });
};

export const listWithPagination = async (entity, where = {}, page = 1, pageSize = null) => {
  const spec = getSpec(entity);
  const tbl = tableName(spec);
  const paginationCfg = await getPaginationConfig();
  const defaultPageSize = spec.list?.pageSize || paginationCfg.default_page_size;
  const maxPageSize = paginationCfg.max_page_size;
  const parsedPageSize = pageSize ? parseInt(pageSize, 10) : null;
  const parsedPage = parseInt(page, 10);
  const finalPageSize = parsedPageSize && !isNaN(parsedPageSize) ? Math.min(parsedPageSize, maxPageSize) : defaultPageSize;
  const finalPage = !isNaN(parsedPage) ? Math.max(1, parsedPage) : 1;
  const wc = [], p = [];
  Object.entries(where).forEach(([k, v]) => { if (v !== undefined && v !== null) { wc.push(`"${tbl}"."${k}"=?`); p.push(v); } });
  if (spec.fields.status && !where.status) wc.push(`"${tbl}"."status"!='${RECORD_STATUS.DELETED}'`);
  if (spec.fields.archived && !where.archived) wc.push(`"${tbl}"."archived"=0`);
  const whereClause = wc.length ? ` WHERE ` + wc.join(` AND `) : '';
  const total = execGet(`SELECT COUNT(*) as c FROM "${tbl}"${whereClause}`, p, { entity, operation: 'Count' }).c;
  const items = list(entity, where, { limit: finalPageSize, offset: (finalPage - 1) * finalPageSize });
  return { items, pagination: { page: finalPage, pageSize: finalPageSize, total, totalPages: Math.ceil(total / finalPageSize), hasMore: finalPage < Math.ceil(total / finalPageSize) } };
};

export const get = (entity, id) => {
  const spec = getSpec(entity);
  const { sql, params } = buildSpecQuery(spec, { id });
  return execGet(sql, params, { entity, operation: 'Get' });
};

export const getBy = (entity, field, value) => {
  const spec = getSpec(entity);
  const { sql, params } = buildSpecQuery(spec, { [field]: value });
  try { return execGet(sql, params, { entity, operation: 'GetBy' }) || null; } catch { return null; }
};

export const search = (entity, query, where = {}, opts = {}) => {
  const spec = getSpec(entity);
  const tbl = tableName(spec);
  const searchFields = spec.list?.searchFields || spec.fields ? Object.entries(spec.fields).filter(([,f]) => f.search).map(([k]) => k) : [];
  if (!searchFields.length || !query) return list(entity, where, opts);
  const escaped = query.replace(/[%_]/g, c => '\\' + c);
  const { sql: baseSql, params: baseParams } = buildSpecQuery(spec, where, opts);
  const table = `"${tbl}"`, searchClauses = searchFields.map(f => `${table}."${f}" LIKE ? ESCAPE '\\'`).join(` OR `);
  const sql = baseSql.includes('WHERE') ? baseSql.replace(` WHERE `, ` WHERE (${searchClauses}) AND `) : `${baseSql} WHERE (${searchClauses})`;
  return execQuery(sql, [...searchFields.map(() => `%${escaped}%`), ...baseParams], { entity, operation: 'Search' });
};

export const searchWithPagination = async (entity, query, where = {}, page = 1, pageSize = null) => {
  const spec = getSpec(entity);
  const tbl = tableName(spec);
  const searchFields = spec.list?.searchFields || spec.fields ? Object.entries(spec.fields).filter(([,f]) => f.search).map(([k]) => k) : [];
  if (!searchFields.length || !query) return await listWithPagination(entity, where, page, pageSize);
  const escaped = query.replace(/[%_]/g, c => '\\' + c);
  const paginationCfg = await getPaginationConfig();
  const defaultPageSize = spec.list?.pageSize || paginationCfg.default_page_size;
  const maxPageSize = paginationCfg.max_page_size;
  const parsedPageSize = pageSize ? parseInt(pageSize, 10) : null;
  const parsedPage = parseInt(page, 10);
  const finalPageSize = parsedPageSize && !isNaN(parsedPageSize) ? Math.min(parsedPageSize, maxPageSize) : defaultPageSize;
  const finalPage = !isNaN(parsedPage) ? Math.max(1, parsedPage) : 1;
  const table = tbl, searchClauses = searchFields.map(f => `"${table}"."${f}" LIKE ? ESCAPE '\\'`).join(` OR `);
  const wc = [], p = [];
  Object.entries(where).forEach(([k, v]) => { if (v !== undefined && v !== null) { wc.push(`"${table}"."${k}"=?`); p.push(v); } });
  if (spec.fields.status && !where.status) wc.push(`"${table}"."status"!='${RECORD_STATUS.DELETED}'`);
  if (spec.fields.archived && !where.archived) wc.push(`"${table}"."archived"=0`);
  const whereClause = wc.length ? ` AND (${wc.join(` AND `)})` : '';
  const countSql = `SELECT COUNT(*) as c FROM "${table}" WHERE (${searchClauses})${whereClause}`;
  const total = execGet(countSql, [...searchFields.map(() => `%${escaped}%`), ...p], { entity, operation: 'Count' }).c;
  const items = search(entity, query, where, { limit: finalPageSize, offset: (finalPage - 1) * finalPageSize });
  return { items, pagination: { page: finalPage, pageSize: finalPageSize, total, totalPages: Math.ceil(total / finalPageSize), hasMore: finalPage < Math.ceil(total / finalPageSize) } };
};

export const count = (entity, where = {}) => {
  const spec = getSpec(entity);
  const tbl = tableName(spec);
  const wc = Object.entries(where).filter(([,v]) => v !== undefined).map(([k]) => `${k}=?`);
  if (spec.fields.status) wc.push(`status!='${RECORD_STATUS.DELETED}'`);
  if (spec.fields.archived && !where.archived) wc.push(`archived=0`);
  const sql = `SELECT COUNT(*) as c FROM ${tbl}${wc.length ? ` WHERE ` + wc.join(` AND `) : ''}`;
  try { return execGet(sql, Object.values(where).filter(v => v !== undefined), { entity, operation: 'Count' }).c || 0; } catch { return 0; }
};

export const create = (entity, data, user) => {
  const spec = getSpec(entity);
  const tbl = tableName(spec);
  const fields = { id: data.id || genId() };

  if (spec.fields.created_at) fields.created_at = now();
  if (spec.fields.updated_at) fields.updated_at = now();
  if (spec.fields.created_by && user) fields.created_by = user.id;

  iterateCreateFields(spec, (key, field) => {
    if (fields[key] !== undefined) return;
    if (field.auto === 'now' || field.auto === 'update') fields[key] = now();
    else if (field.auto === 'user' && user) fields[key] = user.id;
    else if (data[key] !== undefined && data[key] !== '') {
      const v = coerceFieldValue(data[key], field.type);
      if (v !== undefined) fields[key] = v;
    }
    else if (field.default !== undefined) fields[key] = coerceFieldValue(field.default, field.type);
  });

  const keys = Object.keys(fields);
  execRun(`INSERT INTO ${tbl} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, Object.values(fields), { entity, operation: 'Create' });
  return { id: fields.id, ...fields };
};

export const update = (entity, id, data, user) => {
  const spec = getSpec(entity);
  const tbl = tableName(spec);
  const fields = {};

  if (spec.fields.updated_at) fields.updated_at = now();

  iterateUpdateFields(spec, (key, field) => {
    if (fields[key] !== undefined) return;
    if (field.auto === 'update') fields[key] = now();
    else if (data[key] !== undefined) {
      const v = coerceFieldValue(data[key], field.type);
      fields[key] = v === undefined ? null : v;
    }
  });

  if (!Object.keys(fields).length) return;
  const sql = `UPDATE ${tbl} SET ${Object.keys(fields).map(k => `${k}=?`).join(',')} WHERE id=?`;
  const values = [...Object.values(fields), id];
  console.log(`[query-engine] UPDATE ${entity} fields:`, Object.keys(fields), 'values:', values.slice(0, -1));
  execRun(sql, values, { entity, operation: 'Update' });
};

export const remove = (entity, id) => {
  const spec = getSpec(entity);
  const tbl = tableName(spec);
  if (spec.fields.status) {
    const hasUpdatedAt = spec.fields.updated_at;
    execRun(hasUpdatedAt ? `UPDATE ${tbl} SET status='${RECORD_STATUS.DELETED}', updated_at=? WHERE id=?` : `UPDATE ${tbl} SET status='${RECORD_STATUS.DELETED}' WHERE id=?`, hasUpdatedAt ? [now(), id] : [id], { entity, operation: 'SoftDelete' });
  } else {
    execRun(`DELETE FROM ${tbl} WHERE id=?`, [id], { entity, operation: 'HardDelete' });
  }
};

export const getChildren = (parentEntity, parentId, childDef) => {
  const foreignKey = childDef.foreignKey || `${parentEntity}_id`;
  return list(childDef.entity, { [foreignKey]: parentId });
};

export const batchGetChildren = (parentEntity, parentId, childSpecs) => {
  const childEntries = Array.isArray(childSpecs) ? childSpecs.map(s => [s, { entity: s }]) : Object.entries(childSpecs);
  const queries = childEntries.map(async ([key, def]) => {
    const entity = def.entity || def;
    const foreignKey = def.foreignKey || `${parentEntity}_id`;
    const results = list(entity, { [foreignKey]: parentId });
    return [key, results];
  });
  return Promise.all(queries).then(results => Object.fromEntries(results));
};

export { execQuery, execGet, execRun };
