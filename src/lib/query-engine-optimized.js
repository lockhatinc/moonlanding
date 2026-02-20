import { genId, now } from '@/lib/database-core';
import { iterateCreateFields, iterateUpdateFields } from '@/lib/field-iterator';
import { coerceFieldValue } from '@/lib/field-registry';
import {
  execQuery, execGet, execRun, withTransaction,
  parsePagination, tableName, buildSpecQuery, buildCountWhere, paginationResult,
  getCached, setCached, getSpec, RECORD_STATUS
} from '@/lib/query-engine-optimized-core';

export const list = (entity, where = {}, opts = {}) => {
  const cacheKey = `list:${entity}:${JSON.stringify(where)}:${JSON.stringify(opts)}`;
  const cached = getCached(cacheKey, entity);
  if (cached) return cached;
  const spec = getSpec(entity);
  const { sql, params } = buildSpecQuery(spec, where, opts);
  const result = execQuery(sql, params, { entity, operation: 'List' });
  setCached(cacheKey, result, entity);
  return result;
};

export const listWithPagination = async (entity, where = {}, page = 1, pageSize = null) => {
  const spec = getSpec(entity);
  const tbl = tableName(spec);
  const { finalPage, finalPageSize } = await parsePagination(spec, page, pageSize);
  const countCacheKey = `count:${entity}:${JSON.stringify(where)}`;
  let total = getCached(countCacheKey, entity);
  if (total === null) {
    const { wc, p } = buildCountWhere(tbl, spec, where);
    const whereClause = wc.length ? ` WHERE ` + wc.join(` AND `) : '';
    total = execGet(`SELECT COUNT(*) as c FROM "${tbl}"${whereClause}`, p, { entity, operation: 'Count' }).c;
    setCached(countCacheKey, total, entity);
  }
  const items = list(entity, where, { limit: finalPageSize, offset: (finalPage - 1) * finalPageSize });
  return paginationResult(items, finalPage, finalPageSize, total);
};

export const get = (entity, id) => {
  const cacheKey = `get:${entity}:${id}`;
  const cached = getCached(cacheKey, entity);
  if (cached) return cached;
  const spec = getSpec(entity);
  const { sql, params } = buildSpecQuery(spec, { id });
  const result = execGet(sql, params, { entity, operation: 'Get' });
  if (result) setCached(cacheKey, result, entity);
  return result;
};

export const getBy = (entity, field, value) => {
  const cacheKey = `getBy:${entity}:${field}:${value}`;
  const cached = getCached(cacheKey, entity);
  if (cached !== null) return cached;
  const spec = getSpec(entity);
  const { sql, params } = buildSpecQuery(spec, { [field]: value });
  try {
    const result = execGet(sql, params, { entity, operation: 'GetBy' }) || null;
    setCached(cacheKey, result, entity);
    return result;
  } catch { return null; }
};

export const search = (entity, query, where = {}, opts = {}) => {
  const cacheKey = `search:${entity}:${query}:${JSON.stringify(where)}:${JSON.stringify(opts)}`;
  const cached = getCached(cacheKey, entity);
  if (cached) return cached;
  const spec = getSpec(entity);
  const tbl = tableName(spec);
  const searchFields = spec.list?.searchFields || spec.fields ? Object.entries(spec.fields).filter(([,f]) => f.search).map(([k]) => k) : [];
  if (!searchFields.length || !query) return list(entity, where, opts);
  const { sql: baseSql, params: baseParams } = buildSpecQuery(spec, where, opts);
  const table = `"${tbl}"`, searchClauses = searchFields.map(f => `${table}."${f}" LIKE ?`).join(` OR `);
  const sql = baseSql.includes('WHERE') ? baseSql.replace(` WHERE `, ` WHERE (${searchClauses}) AND `) : `${baseSql} WHERE (${searchClauses})`;
  const result = execQuery(sql, [...searchFields.map(() => `%${query}%`), ...baseParams], { entity, operation: 'Search' });
  setCached(cacheKey, result, entity);
  return result;
};

export const searchWithPagination = async (entity, query, where = {}, page = 1, pageSize = null) => {
  const spec = getSpec(entity);
  const tbl = tableName(spec);
  const searchFields = spec.list?.searchFields || spec.fields ? Object.entries(spec.fields).filter(([,f]) => f.search).map(([k]) => k) : [];
  if (!searchFields.length || !query) return await listWithPagination(entity, where, page, pageSize);
  const { finalPage, finalPageSize } = await parsePagination(spec, page, pageSize);
  const countCacheKey = `searchCount:${entity}:${query}:${JSON.stringify(where)}`;
  let total = getCached(countCacheKey, entity);
  if (total === null) {
    const searchClauses = searchFields.map(f => `${tbl}.${f} LIKE ?`).join(` OR `);
    const wc = [], p = [];
    Object.entries(where).forEach(([k, v]) => { if (v !== undefined && v !== null) { wc.push(`${tbl}.${k}=?`); p.push(v); } });
    if (spec.fields.status && !where.status) wc.push(`${tbl}.status!='${RECORD_STATUS.DELETED}'`);
    if (spec.fields.archived && !where.archived) wc.push(`${tbl}.archived=0`);
    const whereClause = wc.length ? ` AND (${wc.join(` AND `)})` : '';
    total = execGet(`SELECT COUNT(*) as c FROM ${tbl} WHERE (${searchClauses})${whereClause}`, [...searchFields.map(() => `%${query}%`), ...p], { entity, operation: 'Count' }).c;
    setCached(countCacheKey, total, entity);
  }
  const items = search(entity, query, where, { limit: finalPageSize, offset: (finalPage - 1) * finalPageSize });
  return paginationResult(items, finalPage, finalPageSize, total);
};

export const count = (entity, where = {}) => {
  const cacheKey = `count:${entity}:${JSON.stringify(where)}`;
  const cached = getCached(cacheKey, entity);
  if (cached !== null) return cached;
  const spec = getSpec(entity);
  const tbl = tableName(spec);
  const wc = Object.entries(where).filter(([,v]) => v !== undefined).map(([k]) => `${k}=?`);
  if (spec.fields.status) wc.push(`status!='${RECORD_STATUS.DELETED}'`);
  if (spec.fields.archived && !where.archived) wc.push(`archived=0`);
  const sql = `SELECT COUNT(*) as c FROM ${tbl}${wc.length ? ` WHERE ` + wc.join(` AND `) : ''}`;
  try {
    const result = execGet(sql, Object.values(where).filter(v => v !== undefined), { entity, operation: 'Count' }).c || 0;
    setCached(cacheKey, result, entity);
    return result;
  } catch { return 0; }
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
  execRun(sql, [...Object.values(fields), id], { entity, operation: 'Update' });
};

export const remove = (entity, id) => {
  const spec = getSpec(entity);
  const tbl = tableName(spec);
  if (spec.fields.status) {
    const hasUpdatedAt = spec.fields.updated_at;
    const delStatus = RECORD_STATUS.DELETED;
    execRun(hasUpdatedAt ? `UPDATE ${tbl} SET status='${delStatus}', updated_at=? WHERE id=?` : `UPDATE ${tbl} SET status='${delStatus}' WHERE id=?`, hasUpdatedAt ? [now(), id] : [id], { entity, operation: 'SoftDelete' });
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
    return [key, list(entity, { [foreignKey]: parentId })];
  });
  return Promise.all(queries).then(results => Object.fromEntries(results));
};

export { execQuery, execGet, execRun, withTransaction };
