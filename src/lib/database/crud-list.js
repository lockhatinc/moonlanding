import { getDatabase, now } from './database-init';
import { getSpec, getSearchFields } from '@/config';
import { createQueryBuilder } from './query-builder';
import { createPaginationMetadata } from './pagination-builder';

function buildSelectSQL(spec, where = {}, options = {}) {
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

  if (spec.fields.status && !where.status && !options.includeDeleted) {
    whereClauses.push(`${table}.status != 'deleted'`);
  }

  let sql = `SELECT ${selects.join(', ')} FROM ${table}`;
  if (joins.length) {
    sql += ' ' + joins.join(' ');
  }
  if (whereClauses.length) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }

  const sort = options.sort || spec.list?.defaultSort;
  if (sort) {
    sql += ` ORDER BY ${table}.${sort.field} ${(sort.dir || 'ASC').toUpperCase()}`;
  }

  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }
  }

  return { sql, params };
}

export function list(entityName, where = {}, options = {}) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const { sql, params } = buildSelectSQL(spec, where, options);

  try {
    const db = getDatabase();
    const items = db.prepare(sql).all(...params);
    return items;
  } catch (error) {
    console.error(`[DATABASE] List error for ${entityName}:`, { where, options, error: error.message });
    throw error;
  }
}

export function listWithPagination(entityName, where = {}, page = 1, pageSize = 20, options = {}) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  try {
    const db = getDatabase();

    const countSQL = `SELECT COUNT(*) as count FROM ${spec.name}${
      Object.keys(where).length ? ' WHERE ' + Object.keys(where).map(k => `${k} = ?`).join(' AND ') : ''
    }`;
    const countParams = Object.values(where);
    const countResult = db.prepare(countSQL).get(...countParams);
    const total = countResult?.count || 0;

    const listOptions = {
      ...options,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };

    const items = list(entityName, where, listOptions);

    const pagination = createPaginationMetadata(total, page, pageSize);

    return {
      items,
      pagination,
    };
  } catch (error) {
    console.error(`[DATABASE] ListWithPagination error for ${entityName}:`, { error: error.message });
    throw error;
  }
}

export function search(entityName, query, where = {}, options = {}) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const searchFields = getSearchFields(spec);
  if (!searchFields.length || !query) {
    return list(entityName, where, options);
  }

  const table = spec.name;
  const { sql: baseSql, params: baseParams } = buildSelectSQL(spec, where, {});

  const searchClauses = searchFields.map(f => `${table}.${f} LIKE ?`).join(' OR ');
  const searchParams = searchFields.map(() => `%${query}%`);

  let sql;
  if (baseSql.includes('WHERE')) {
    sql = baseSql.replace(' WHERE ', ` WHERE (${searchClauses}) AND `);
  } else {
    sql = `${baseSql} WHERE (${searchClauses})`;
  }

  if (options.sort) {
    sql += ` ORDER BY ${table}.${options.sort.field} ${(options.sort.dir || 'ASC').toUpperCase()}`;
  }

  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }
  }

  try {
    const db = getDatabase();
    return db.prepare(sql).all(...searchParams, ...baseParams);
  } catch (error) {
    console.error(`[DATABASE] Search error for ${entityName} (query: "${query}"):`, { error: error.message });
    throw error;
  }
}

export function count(entityName, where = {}) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

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

  const sql = `SELECT COUNT(*) as count FROM ${spec.name}${
    whereClauses.length ? ' WHERE ' + whereClauses.join(' AND ') : ''
  }`;

  try {
    const db = getDatabase();
    const result = db.prepare(sql).get(...params);
    return result?.count || 0;
  } catch (error) {
    console.error(`[DATABASE] Count error for ${entityName}:`, { error: error.message });
    return 0;
  }
}
