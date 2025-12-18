import { getDatabase, genId, now } from '@/lib/database-core';
import { getSpec } from '@/config';
import { RECORD_STATUS } from '@/config/constants';
import { iterateCreateFields, iterateUpdateFields } from '@/lib/field-iterator';
import { coerceFieldValue } from '@/lib/field-registry';
import { execGet, execQuery, execRun, withTransaction } from '@/lib/query-wrapper';

const db = getDatabase();

function buildSpecQuery(spec, where = {}, options = {}) {
  const table = spec.name, selects = [`${table}.*`], joins = [];
  if (spec.computed) Object.entries(spec.computed).forEach(([k, c]) => selects.push(`${c.sql} as ${k}`));
  Object.entries(spec.fields).forEach(([k, f]) => {
    if (f.type === 'ref' && f.display) {
      const a = `${f.ref}_${k}`;
      joins.push(`LEFT JOIN ${f.ref} ${a} ON ${table}.${k} = ${a}.id`);
      selects.push(`${a}.${f.display.split('.')[1] || 'name'} as ${k}_display`);
    }
  });
  const wc = [], p = [];
  Object.entries(where).forEach(([k, v]) => { if (v !== undefined && v !== null) { wc.push(`${table}.${k} = ?`); p.push(v); } });
  if (spec.fields.status && !where.status && !options.includeDeleted) wc.push(`${table}.status != '${RECORD_STATUS.DELETED}'`);
  let sql = `SELECT ${selects.join(', ')} FROM ${table}`;
  if (joins.length) sql += ' ' + joins.join(' ');
  if (wc.length) sql += ' WHERE ' + wc.join(' AND ');
  const sort = options.sort || spec.list?.defaultSort;
  if (sort) sql += ` ORDER BY ${table}.${sort.field} ${(sort.dir || 'ASC').toUpperCase()}`;
  if (options.limit) { sql += ` LIMIT ${options.limit}`; if (options.offset) sql += ` OFFSET ${options.offset}`; }
  return { sql, params: p };
}

export const list = (entity, where = {}, opts = {}) => {
  const spec = getSpec(entity);
  const { sql, params } = buildSpecQuery(spec, where, opts);
  return execQuery(sql, params, { entity, operation: 'List' });
};

export const listWithPagination = (entity, where = {}, page = 1, pageSize = 20) => {
  const spec = getSpec(entity);
  const wc = Object.keys(where).length ? ' WHERE ' + Object.keys(where).map(k => `${k}=?`).join(' AND ') : '';
  const total = execGet(`SELECT COUNT(*) as c FROM ${spec.name}${wc}`, Object.values(where), { entity, operation: 'Count' }).c;
  const items = list(entity, where, { limit: pageSize, offset: (page - 1) * pageSize });
  return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: page < Math.ceil(total / pageSize) } };
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

export const search = (entity, query, where = {}) => {
  const spec = getSpec(entity);
  const searchFields = spec.fields ? Object.entries(spec.fields).filter(([,f]) => f.search).map(([k]) => k) : [];
  if (!searchFields.length || !query) return list(entity, where);
  const { sql: baseSql, params: baseParams } = buildSpecQuery(spec, where);
  const table = spec.name, searchClauses = searchFields.map(f => `${table}.${f} LIKE ?`).join(' OR ');
  const sql = baseSql.includes('WHERE') ? baseSql.replace(' WHERE ', ` WHERE (${searchClauses}) AND `) : `${baseSql} WHERE (${searchClauses})`;
  return execQuery(sql, [...searchFields.map(() => `%${query}%`), ...baseParams], { entity, operation: 'Search' });
};

export const count = (entity, where = {}) => {
  const spec = getSpec(entity);
  const wc = Object.entries(where).filter(([,v]) => v !== undefined).map(([k]) => `${k}=?`);
  if (spec.fields.status) wc.push(`status!='${RECORD_STATUS.DELETED}'`);
  const sql = `SELECT COUNT(*) as c FROM ${spec.name}${wc.length ? ' WHERE ' + wc.join(' AND ') : ''}`;
  try { return execGet(sql, Object.values(where).filter(v => v !== undefined), { entity, operation: 'Count' }).c || 0; } catch { return 0; }
};

export const create = (entity, data, user) => {
  const spec = getSpec(entity);
  const fields = { id: data.id || genId() };
  iterateCreateFields(spec, (key, field) => {
    if (field.auto === 'now') fields[key] = now();
    else if (field.auto === 'user' && user) fields[key] = user.id;
    else if (data[key] !== undefined && data[key] !== '') {
      const v = coerceFieldValue(data[key], field.type);
      if (v !== undefined) fields[key] = v;
    }
    else if (field.default !== undefined) fields[key] = coerceFieldValue(field.default, field.type);
  });
  const keys = Object.keys(fields);
  execRun(`INSERT INTO ${spec.name} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, Object.values(fields), { entity, operation: 'Create' });
  return { id: fields.id, ...fields };
};

export const update = (entity, id, data, user) => {
  const spec = getSpec(entity);
  const fields = {};
  iterateUpdateFields(spec, (key, field) => {
    if (field.auto === 'update') fields[key] = now();
    else if (data[key] !== undefined) {
      const v = coerceFieldValue(data[key], field.type);
      fields[key] = v === undefined ? null : v;
    }
  });
  if (!Object.keys(fields).length) return;
  execRun(`UPDATE ${spec.name} SET ${Object.keys(fields).map(k => `${k}=?`).join(',')} WHERE id=?`, [...Object.values(fields), id], { entity, operation: 'Update' });
};

export const remove = (entity, id) => {
  const spec = getSpec(entity);
  if (spec.fields.status) {
    const hasUpdatedAt = spec.fields.updated_at;
    execRun(hasUpdatedAt ? `UPDATE ${spec.name} SET status='${RECORD_STATUS.DELETED}', updated_at=? WHERE id=?` : `UPDATE ${spec.name} SET status='${RECORD_STATUS.DELETED}' WHERE id=?`, hasUpdatedAt ? [now(), id] : [id], { entity, operation: 'SoftDelete' });
  } else {
    execRun(`DELETE FROM ${spec.name} WHERE id=?`, [id], { entity, operation: 'HardDelete' });
  }
};

export { withTransaction };

export const getChildren = (parentEntity, parentId, childDef) => {
  const foreignKey = childDef.foreignKey || `${parentEntity}_id`;
  return list(childDef.entity, { [foreignKey]: parentId });
};
