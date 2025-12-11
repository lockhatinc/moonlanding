import db, { genId, now } from './db';
import { getSpec } from './spec';

// Build SELECT query with joins for refs
function buildSelect(spec, where = {}, options = {}) {
  const table = `${spec.name}s`;
  const selects = [`${table}.*`];
  const joins = [];

  // Add computed fields
  if (spec.computed) {
    for (const [key, comp] of Object.entries(spec.computed)) {
      selects.push(`${comp.sql} as ${key}`);
    }
  }

  // Add ref display fields
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'ref' && field.display) {
      const refTable = `${field.ref}s`;
      const alias = `${field.ref}_${key}`;
      const displayField = field.display.split('.')[1] || 'name';
      joins.push(`LEFT JOIN ${refTable} ${alias} ON ${table}.${key} = ${alias}.id`);
      selects.push(`${alias}.${displayField} as ${key}_display`);
    }
  }

  // Build WHERE clause
  const whereClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(where)) {
    if (value !== undefined && value !== null) {
      whereClauses.push(`${table}.${key} = ?`);
      params.push(value);
    }
  }

  // Exclude deleted by default
  if (spec.fields.status && !where.status && !options.includeDeleted) {
    whereClauses.push(`${table}.status != 'deleted'`);
  }

  let sql = `SELECT ${selects.join(', ')} FROM ${table}`;
  if (joins.length) sql += ' ' + joins.join(' ');
  if (whereClauses.length) sql += ' WHERE ' + whereClauses.join(' AND ');

  // Sort
  const sort = options.sort || spec.list?.defaultSort;
  if (sort) {
    sql += ` ORDER BY ${table}.${sort.field} ${sort.dir?.toUpperCase() || 'ASC'}`;
  }

  // Limit
  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
    if (options.offset) sql += ` OFFSET ${options.offset}`;
  }

  return { sql, params };
}

// List records
export function list(entityName, where = {}, options = {}) {
  const spec = getSpec(entityName);
  const { sql, params } = buildSelect(spec, where, options);

  try {
    return db.prepare(sql).all(...params);
  } catch (e) {
    console.error('List query error:', e.message, sql);
    return [];
  }
}

// Get single record
export function get(entityName, id) {
  const spec = getSpec(entityName);
  const { sql, params } = buildSelect(spec, { id });

  try {
    return db.prepare(sql).get(...params);
  } catch (e) {
    console.error('Get query error:', e.message);
    return null;
  }
}

// Create record
export function create(entityName, data, user) {
  const spec = getSpec(entityName);
  const id = data.id || genId();
  const fields = { id };

  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'id') continue;

    if (field.auto === 'now') {
      fields[key] = now();
    } else if (field.auto === 'user' && user) {
      fields[key] = user.id;
    } else if (data[key] !== undefined && data[key] !== '') {
      if (field.type === 'json') {
        fields[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
      } else if (field.type === 'bool') {
        fields[key] = data[key] === true || data[key] === 'true' || data[key] === 'on' || data[key] === 1 ? 1 : 0;
      } else if (field.type === 'int') {
        fields[key] = parseInt(data[key], 10) || 0;
      } else if (field.type === 'decimal') {
        fields[key] = parseFloat(data[key]) || 0;
      } else if (field.type === 'date' || field.type === 'timestamp') {
        // Handle date strings
        if (typeof data[key] === 'string' && data[key].includes('-')) {
          fields[key] = Math.floor(new Date(data[key]).getTime() / 1000);
        } else {
          fields[key] = parseInt(data[key], 10) || 0;
        }
      } else {
        fields[key] = data[key];
      }
    } else if (field.default !== undefined) {
      fields[key] = field.default;
    }
  }

  const keys = Object.keys(fields);
  const sql = `INSERT INTO ${spec.name}s (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;

  try {
    db.prepare(sql).run(...Object.values(fields));
    return { id, ...fields };
  } catch (e) {
    console.error('Create error:', e.message, sql);
    throw e;
  }
}

// Update record
export function update(entityName, id, data, user) {
  const spec = getSpec(entityName);
  const fields = {};

  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.readOnly || field.type === 'id') continue;

    if (field.auto === 'update') {
      fields[key] = now();
    } else if (data[key] !== undefined) {
      if (field.type === 'json') {
        fields[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
      } else if (field.type === 'bool') {
        fields[key] = data[key] === true || data[key] === 'true' || data[key] === 'on' || data[key] === 1 ? 1 : 0;
      } else if (field.type === 'int') {
        fields[key] = parseInt(data[key], 10) || 0;
      } else if (field.type === 'decimal') {
        fields[key] = parseFloat(data[key]) || 0;
      } else if (field.type === 'date' || field.type === 'timestamp') {
        if (typeof data[key] === 'string' && data[key].includes('-')) {
          fields[key] = Math.floor(new Date(data[key]).getTime() / 1000);
        } else if (data[key] === '') {
          fields[key] = null;
        } else {
          fields[key] = parseInt(data[key], 10) || 0;
        }
      } else {
        fields[key] = data[key] === '' ? null : data[key];
      }
    }
  }

  if (Object.keys(fields).length === 0) return;

  const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  const sql = `UPDATE ${spec.name}s SET ${sets} WHERE id = ?`;

  try {
    db.prepare(sql).run(...Object.values(fields), id);
  } catch (e) {
    console.error('Update error:', e.message);
    throw e;
  }
}

// Soft delete (or hard delete if no status field)
export function remove(entityName, id) {
  const spec = getSpec(entityName);

  try {
    if (spec.fields.status) {
      db.prepare(`UPDATE ${spec.name}s SET status = 'deleted', updated_at = ? WHERE id = ?`).run(now(), id);
    } else {
      db.prepare(`DELETE FROM ${spec.name}s WHERE id = ?`).run(id);
    }
  } catch (e) {
    console.error('Remove error:', e.message);
    throw e;
  }
}

// Search records
export function search(entityName, query, where = {}) {
  const spec = getSpec(entityName);
  const searchFields = Object.entries(spec.fields)
    .filter(([_, f]) => f.search)
    .map(([k]) => k);

  if (!searchFields.length || !query) {
    return list(entityName, where);
  }

  const table = `${spec.name}s`;
  const { sql: baseSql, params: baseParams } = buildSelect(spec, where);
  const searchClauses = searchFields.map(f => `${table}.${f} LIKE ?`).join(' OR ');
  const searchParams = searchFields.map(() => `%${query}%`);

  let sql;
  if (baseSql.includes('WHERE')) {
    sql = baseSql.replace(' WHERE ', ` WHERE (${searchClauses}) AND `);
  } else {
    const orderIdx = baseSql.indexOf(' ORDER BY');
    if (orderIdx !== -1) {
      sql = baseSql.slice(0, orderIdx) + ` WHERE (${searchClauses})` + baseSql.slice(orderIdx);
    } else {
      sql = `${baseSql} WHERE (${searchClauses})`;
    }
  }

  try {
    return db.prepare(sql).all(...searchParams, ...baseParams);
  } catch (e) {
    console.error('Search error:', e.message, sql);
    return [];
  }
}

// Get children records
export function getChildren(entityName, parentId, childDef) {
  const where = { [childDef.fk]: parentId };
  if (childDef.filter) Object.assign(where, childDef.filter);
  return list(childDef.entity, where);
}

// Count records
export function count(entityName, where = {}) {
  const spec = getSpec(entityName);
  const whereClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(where)) {
    if (value !== undefined) {
      whereClauses.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (spec.fields.status && !where.status) {
    whereClauses.push(`status != 'deleted'`);
  }

  const sql = `SELECT COUNT(*) as count FROM ${spec.name}s${whereClauses.length ? ' WHERE ' + whereClauses.join(' AND ') : ''}`;

  try {
    return db.prepare(sql).get(...params).count;
  } catch (e) {
    console.error('Count error:', e.message);
    return 0;
  }
}

// Bulk create
export function bulkCreate(entityName, records, user) {
  const results = [];
  const transaction = db.transaction(() => {
    for (const data of records) {
      results.push(create(entityName, data, user));
    }
  });
  transaction();
  return results;
}

// Get record by field value
export function getBy(entityName, field, value) {
  const spec = getSpec(entityName);
  const { sql, params } = buildSelect(spec, { [field]: value });

  try {
    return db.prepare(sql).get(...params);
  } catch (e) {
    console.error('GetBy error:', e.message);
    return null;
  }
}
