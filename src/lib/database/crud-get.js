import { getDatabase } from './database-init';
import { getSpec } from '@/config';

function buildSelectSQL(spec, where = {}) {
  const table = spec.name;
  const selects = [`${table}.*`];
  const joins = [];

  if (spec.computed) {
    for (const [key, comp] of Object.entries(spec.computed)) {
      selects.push(`${comp.sql} as ${key}`);
    }
  }

  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'ref' && field.display) {
      const refTableName = field.ref;
      const refAlias = `${refTableName}_${key}`;
      const displayField = field.display.split('.')[1] || 'name';
      joins.push(`LEFT JOIN ${refTableName} ${refAlias} ON ${table}.${key} = ${refAlias}.id`);
      selects.push(`${refAlias}.${displayField} as ${key}_display`);
    }
  }

  const whereClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(where)) {
    if (value !== undefined && value !== null) {
      whereClauses.push(`${table}.${key} = ?`);
      params.push(value);
    }
  }

  if (spec.fields.status && !where.status) {
    whereClauses.push(`${table}.status != 'deleted'`);
  }

  let sql = `SELECT ${selects.join(', ')} FROM ${table}`;
  if (joins.length) {
    sql += ' ' + joins.join(' ');
  }
  if (whereClauses.length) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }

  return { sql, params };
}

export function get(entityName, id) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const { sql, params } = buildSelectSQL(spec, { id });

  try {
    const db = getDatabase();
    const record = db.prepare(sql).get(...params);
    return record || null;
  } catch (error) {
    console.error(`[DATABASE] Get error for ${entityName}:${id}:`, { error: error.message });
    throw error;
  }
}

export function getBy(entityName, field, value) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  if (!spec.fields[field]) {
    throw new Error(`Unknown field: ${field} on ${entityName}`);
  }

  const { sql, params } = buildSelectSQL(spec, { [field]: value });

  try {
    const db = getDatabase();
    const record = db.prepare(sql).get(...params);
    return record || null;
  } catch (error) {
    console.error(`[DATABASE] GetBy error for ${entityName}.${field}:${value}:`, { error: error.message });
    throw error;
  }
}

export function getWithRelations(entityName, id, relationNames = []) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const record = get(entityName, id);
  if (!record) return null;

  const relations = {};

  for (const relationName of relationNames) {
    const childDef = spec.children?.[relationName];
    if (!childDef) continue;

    try {
      const childEntity = childDef.entity;
      const fk = childDef.fk || `${entityName}_id`;
      relations[relationName] = getChildren(childEntity, id, { fk });
    } catch (error) {
      console.warn(`[DATABASE] Error loading relation ${relationName}:`, { error: error.message });
    }
  }

  return {
    ...record,
    ...relations,
  };
}

export function getChildren(entityName, parentId, childDef) {
  const where = { [childDef.fk]: parentId };
  if (childDef.filter) {
    Object.assign(where, childDef.filter);
  }

  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const table = spec.name;
  const whereClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(where)) {
    if (value !== undefined && value !== null) {
      whereClauses.push(`${table}.${key} = ?`);
      params.push(value);
    }
  }

  let sql = `SELECT * FROM ${table}`;
  if (whereClauses.length) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }

  try {
    const db = getDatabase();
    return db.prepare(sql).all(...params);
  } catch (error) {
    console.error(`[DATABASE] GetChildren error for ${entityName}:`, { error: error.message });
    throw error;
  }
}
