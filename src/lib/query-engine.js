import { getDatabase, genId, now } from '@/lib/database-core';
import { getSpec } from '@/config';
import { iterateCreateFields, iterateUpdateFields } from '@/lib/field-iterator';
import { coerceFieldValue } from '@/lib/field-registry';

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
  Object.entries(where).forEach(([k, v]) => {
    if (v !== undefined && v !== null) { wc.push(`${table}.${k} = ?`); p.push(v); }
  });
  if (spec.fields.status && !where.status && !options.includeDeleted) wc.push(`${table}.status != 'deleted'`);
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
  try { return db.prepare(sql).all(...params); }
  catch (e) { console.error(`[DB] List ${entity}:`, e.message); throw e; }
};

export const listWithPagination = (entity, where = {}, page = 1, pageSize = 20) => {
  const spec = getSpec(entity);
  const total = db.prepare(`SELECT COUNT(*) as c FROM ${spec.name}${Object.keys(where).length ? ' WHERE ' + Object.keys(where).map(k => `${k}=?`).join(' AND ') : ''}`).get(...Object.values(where)).c;
  const items = list(entity, where, { limit: pageSize, offset: (page - 1) * pageSize });
  return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: page < Math.ceil(total / pageSize) } };
};

export const get = (entity, id) => {
  const spec = getSpec(entity);
  const { sql, params } = buildSpecQuery(spec, { id });
  try { return db.prepare(sql).get(...params); }
  catch (e) { console.error(`[DB] Get ${entity}:${id}:`, e.message); throw e; }
};

export const getBy = (entity, field, value) => {
  const spec = getSpec(entity);
  const { sql, params } = buildSpecQuery(spec, { [field]: value });
  try { return db.prepare(sql).get(...params) || null; }
  catch { return null; }
};

export const search = (entity, query, where = {}) => {
  const spec = getSpec(entity);
  const searchFields = spec.fields ? Object.entries(spec.fields).filter(([,f]) => f.search).map(([k]) => k) : [];
  if (!searchFields.length || !query) return list(entity, where);
  const { sql: baseSql, params: baseParams } = buildSpecQuery(spec, where);
  const table = spec.name, searchClauses = searchFields.map(f => `${table}.${f} LIKE ?`).join(' OR ');
  const sql = baseSql.includes('WHERE') ? baseSql.replace(' WHERE ', ` WHERE (${searchClauses}) AND `) : `${baseSql} WHERE (${searchClauses})`;
  try { return db.prepare(sql).all(...searchFields.map(() => `%${query}%`), ...baseParams); }
  catch (e) { console.error(`[DB] Search ${entity}:`, e.message); throw e; }
};

export const count = (entity, where = {}) => {
  const spec = getSpec(entity);
  const wc = Object.entries(where).filter(([,v]) => v !== undefined).map(([k]) => `${k}=?`);
  if (spec.fields.status) wc.push(`status!='deleted'`);
  const sql = `SELECT COUNT(*) as c FROM ${spec.name}${wc.length ? ' WHERE ' + wc.join(' AND ') : ''}`;
  try { return db.prepare(sql).get(...Object.values(where).filter(v => v !== undefined)).c || 0; }
  catch { return 0; }
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
  try {
    db.prepare(`INSERT INTO ${spec.name} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...Object.values(fields));
    return { id: fields.id, ...fields };
  }
  catch (e) { console.error(`[DB] Create ${entity}:`, e.message); throw e; }
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
  try { db.prepare(`UPDATE ${spec.name} SET ${Object.keys(fields).map(k => `${k}=?`).join(',')} WHERE id=?`).run(...Object.values(fields), id); }
  catch (e) { console.error(`[DB] Update ${entity}:${id}:`, e.message); throw e; }
};

export const remove = (entity, id) => {
  const spec = getSpec(entity);
  try {
    if (spec.fields.status) {
      const hasUpdatedAt = spec.fields.updated_at;
      const sql = hasUpdatedAt ? `UPDATE ${spec.name} SET status='deleted', updated_at=? WHERE id=?` : `UPDATE ${spec.name} SET status='deleted' WHERE id=?`;
      db.prepare(sql).run(hasUpdatedAt ? now() : null, id).filter(Boolean);
    } else db.prepare(`DELETE FROM ${spec.name} WHERE id=?`).run(id);
  }
  catch (e) { console.error(`[DB] Remove ${entity}:${id}:`, e.message); throw e; }
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

export const getChildren = (parentEntity, parentId, childDef) => {
  const foreignKey = childDef.foreignKey || `${parentEntity}_id`;
  return list(childDef.entity, { [foreignKey]: parentId });
};
