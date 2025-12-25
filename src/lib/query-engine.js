import { getDatabase, genId, now } from '@/lib/database-core';
import { getSpec } from '@/config/spec-helpers';
import { RECORD_STATUS } from '@/config/constants';
import { SQL_OPERATORS, SQL_KEYWORDS, QUERY_BUILDING, SORT_DIRECTIONS } from '@/config/query-config';
import { iterateCreateFields, iterateUpdateFields } from '@/lib/field-iterator';
import { coerceFieldValue } from '@/lib/field-registry';
import { execGet, execQuery, execRun, withTransaction } from '@/lib/query-wrapper';

const db = getDatabase();

async function getPaginationConfig() {
  try {
    const { getConfigEngine } = await import('@/lib/config-generator-engine');
    const engine = await getConfigEngine();
    return engine.getConfig().system.pagination;
  } catch (error) {
    console.warn('[query-engine] Failed to load pagination config, using defaults:', error.message);
    return { default_page_size: 50, max_page_size: 500 };
  }
}

function buildSpecQuery(spec, where = {}, options = {}) {
  // Lucia expects 'users' table for the 'user' entity
  const tableName = spec.name === 'user' ? 'users' : spec.name;
  const table = `"${tableName}"`, selects = [`${table}.*`], joins = [];
  if (spec.computed) Object.entries(spec.computed).forEach(([k, c]) => selects.push(`${c.sql} ${SQL_KEYWORDS.as} "${k}"`));
  Object.entries(spec.fields).forEach(([k, f]) => {
    if (f.type === 'ref' && f.display) {
      // Lucia expects 'users' table for the 'user' entity
      const refTableName = f.ref === 'user' ? 'users' : f.ref;
      const a = `"${refTableName}_${k}"`;
      joins.push(`${SQL_KEYWORDS.leftJoin} "${refTableName}" ${a} ON ${table}."${k}" ${SQL_OPERATORS.eq} ${a}.id`);
      selects.push(`${a}."${f.display.split('.')[1] || 'name'}" ${SQL_KEYWORDS.as} "${k}_display"`);
    }
  });
  const wc = [], p = [];
  Object.entries(where).forEach(([k, v]) => { if (v !== undefined && v !== null) { wc.push(`${table}."${k}" ${SQL_OPERATORS.eq} ${QUERY_BUILDING.parameterPlaceholder}`); p.push(v); } });
  if (spec.fields.status && !where.status && !options.includeDeleted) wc.push(`${table}."status" ${SQL_OPERATORS.ne} '${RECORD_STATUS.DELETED}'`);
  if (spec.fields.archived && !where.archived && !options.includeArchived) wc.push(`${table}."archived" ${SQL_OPERATORS.eq} 0`);
  let sql = `${SQL_KEYWORDS.select} ${selects.join(`${QUERY_BUILDING.delimiter} `)} ${SQL_KEYWORDS.from} ${table}`;
  if (joins.length) sql += ' ' + joins.join(' ');
  if (wc.length) sql += ` ${SQL_KEYWORDS.where} ` + wc.join(` ${SQL_KEYWORDS.and} `);
  const sort = options.sort || spec.list?.defaultSort;
  if (sort) sql += ` ${SQL_KEYWORDS.orderBy} ${table}."${sort.field}" ${(sort.dir || SORT_DIRECTIONS.asc).toUpperCase()}`;
  if (options.limit) { sql += ` ${SQL_KEYWORDS.limit} ${options.limit}`; if (options.offset) sql += ` ${SQL_KEYWORDS.offset} ${options.offset}`; }
  return { sql, params: p };
}

export const list = (entity, where = {}, opts = {}) => {
  const spec = getSpec(entity);
  const { sql, params } = buildSpecQuery(spec, where, opts);
  return execQuery(sql, params, { entity, operation: 'List' });
};

export const listWithPagination = async (entity, where = {}, page = 1, pageSize = null) => {
  const spec = getSpec(entity);
  const tableName = spec.name === 'user' ? 'users' : spec.name;
  const paginationCfg = await getPaginationConfig();
  const defaultPageSize = spec.list?.pageSize || paginationCfg.default_page_size;
  const maxPageSize = paginationCfg.max_page_size;
  const parsedPageSize = pageSize ? parseInt(pageSize, 10) : null;
  const parsedPage = parseInt(page, 10);
  const finalPageSize = parsedPageSize && !isNaN(parsedPageSize) ? Math.min(parsedPageSize, maxPageSize) : defaultPageSize;
  const finalPage = !isNaN(parsedPage) ? Math.max(1, parsedPage) : 1;
  const wc = [], p = [];
  Object.entries(where).forEach(([k, v]) => { if (v !== undefined && v !== null) { wc.push(`"${tableName}"."${k}"${SQL_OPERATORS.eq}${QUERY_BUILDING.parameterPlaceholder}`); p.push(v); } });
  if (spec.fields.status && !where.status) wc.push(`"${tableName}"."status"${SQL_OPERATORS.ne}'${RECORD_STATUS.DELETED}'`);
  if (spec.fields.archived && !where.archived) wc.push(`"${tableName}"."archived"${SQL_OPERATORS.eq}0`);
  const whereClause = wc.length ? ` ${SQL_KEYWORDS.where} ` + wc.join(` ${SQL_KEYWORDS.and} `) : '';
  const total = execGet(`${SQL_KEYWORDS.select} ${SQL_KEYWORDS.countAs} c ${SQL_KEYWORDS.from} "${tableName}"${whereClause}`, p, { entity, operation: 'Count' }).c;
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
  const tableName = spec.name === 'user' ? 'users' : spec.name;
  const searchFields = spec.list?.searchFields || spec.fields ? Object.entries(spec.fields).filter(([,f]) => f.search).map(([k]) => k) : [];
  if (!searchFields.length || !query) return list(entity, where, opts);
  const { sql: baseSql, params: baseParams } = buildSpecQuery(spec, where, opts);
  const table = `"${tableName}"`, searchClauses = searchFields.map(f => `${table}."${f}" ${SQL_OPERATORS.like} ${QUERY_BUILDING.parameterPlaceholder}`).join(` ${SQL_KEYWORDS.or} `);
  const sql = baseSql.includes(SQL_KEYWORDS.where) ? baseSql.replace(` ${SQL_KEYWORDS.where} `, ` ${SQL_KEYWORDS.where} (${searchClauses}) ${SQL_KEYWORDS.and} `) : `${baseSql} ${SQL_KEYWORDS.where} (${searchClauses})`;
  return execQuery(sql, [...searchFields.map(() => `${QUERY_BUILDING.wildcard}${query}${QUERY_BUILDING.wildcard}`), ...baseParams], { entity, operation: 'Search' });
};

export const searchWithPagination = async (entity, query, where = {}, page = 1, pageSize = null) => {
  const spec = getSpec(entity);
  const tableName = spec.name === 'user' ? 'users' : spec.name;
  const searchFields = spec.list?.searchFields || spec.fields ? Object.entries(spec.fields).filter(([,f]) => f.search).map(([k]) => k) : [];
  if (!searchFields.length || !query) return await listWithPagination(entity, where, page, pageSize);
  const paginationCfg = await getPaginationConfig();
  const defaultPageSize = spec.list?.pageSize || paginationCfg.default_page_size;
  const maxPageSize = paginationCfg.max_page_size;
  const parsedPageSize = pageSize ? parseInt(pageSize, 10) : null;
  const parsedPage = parseInt(page, 10);
  const finalPageSize = parsedPageSize && !isNaN(parsedPageSize) ? Math.min(parsedPageSize, maxPageSize) : defaultPageSize;
  const finalPage = !isNaN(parsedPage) ? Math.max(1, parsedPage) : 1;
  const table = tableName, searchClauses = searchFields.map(f => `${table}.${f} ${SQL_OPERATORS.like} ${QUERY_BUILDING.parameterPlaceholder}`).join(` ${SQL_KEYWORDS.or} `);
  const wc = [], p = [];
  Object.entries(where).forEach(([k, v]) => { if (v !== undefined && v !== null) { wc.push(`${table}.${k}${SQL_OPERATORS.eq}${QUERY_BUILDING.parameterPlaceholder}`); p.push(v); } });
  if (spec.fields.status && !where.status) wc.push(`${table}.status${SQL_OPERATORS.ne}'${RECORD_STATUS.DELETED}'`);
  if (spec.fields.archived && !where.archived) wc.push(`${table}.archived${SQL_OPERATORS.eq}0`);
  const whereClause = wc.length ? ` ${SQL_KEYWORDS.and} (${wc.join(` ${SQL_KEYWORDS.and} `)})` : '';
  const countSql = `${SQL_KEYWORDS.select} ${SQL_KEYWORDS.countAs} c ${SQL_KEYWORDS.from} ${table} ${SQL_KEYWORDS.where} (${searchClauses})${whereClause}`;
  const total = execGet(countSql, [...searchFields.map(() => `${QUERY_BUILDING.wildcard}${query}${QUERY_BUILDING.wildcard}`), ...p], { entity, operation: 'Count' }).c;
  const items = search(entity, query, where, { limit: finalPageSize, offset: (finalPage - 1) * finalPageSize });
  return { items, pagination: { page: finalPage, pageSize: finalPageSize, total, totalPages: Math.ceil(total / finalPageSize), hasMore: finalPage < Math.ceil(total / finalPageSize) } };
};

export const count = (entity, where = {}) => {
  const spec = getSpec(entity);
  const tableName = spec.name === 'user' ? 'users' : spec.name;
  const wc = Object.entries(where).filter(([,v]) => v !== undefined).map(([k]) => `${k}${SQL_OPERATORS.eq}${QUERY_BUILDING.parameterPlaceholder}`);
  if (spec.fields.status) wc.push(`status${SQL_OPERATORS.ne}'${RECORD_STATUS.DELETED}'`);
  if (spec.fields.archived && !where.archived) wc.push(`archived${SQL_OPERATORS.eq}0`);
  const sql = `${SQL_KEYWORDS.select} ${SQL_KEYWORDS.countAs} c ${SQL_KEYWORDS.from} ${tableName}${wc.length ? ` ${SQL_KEYWORDS.where} ` + wc.join(` ${SQL_KEYWORDS.and} `) : ''}`;
  try { return execGet(sql, Object.values(where).filter(v => v !== undefined), { entity, operation: 'Count' }).c || 0; } catch { return 0; }
};

export const create = (entity, data, user) => {
  const spec = getSpec(entity);
  const tableName = spec.name === 'user' ? 'users' : spec.name;
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
  execRun(`${SQL_KEYWORDS.insert} ${tableName} (${keys.join(QUERY_BUILDING.delimiter)}) ${SQL_KEYWORDS.values} (${keys.map(() => QUERY_BUILDING.parameterPlaceholder).join(QUERY_BUILDING.delimiter)})`, Object.values(fields), { entity, operation: 'Create' });
  return { id: fields.id, ...fields };
};

export const update = (entity, id, data, user) => {
  const spec = getSpec(entity);
  const tableName = spec.name === 'user' ? 'users' : spec.name;
  const fields = {};
  iterateUpdateFields(spec, (key, field) => {
    if (field.auto === 'update') fields[key] = now();
    else if (data[key] !== undefined) {
      const v = coerceFieldValue(data[key], field.type);
      fields[key] = v === undefined ? null : v;
    }
  });
  if (!Object.keys(fields).length) return;
  execRun(`${SQL_KEYWORDS.update} ${tableName} ${SQL_KEYWORDS.set} ${Object.keys(fields).map(k => `${k}${SQL_OPERATORS.eq}${QUERY_BUILDING.parameterPlaceholder}`).join(QUERY_BUILDING.delimiter)} ${SQL_KEYWORDS.where} id${SQL_OPERATORS.eq}${QUERY_BUILDING.parameterPlaceholder}`, [...Object.values(fields), id], { entity, operation: 'Update' });
};

export const remove = (entity, id) => {
  const spec = getSpec(entity);
  const tableName = spec.name === 'user' ? 'users' : spec.name;
  if (spec.fields.status) {
    const hasUpdatedAt = spec.fields.updated_at;
    execRun(hasUpdatedAt ? `${SQL_KEYWORDS.update} ${tableName} ${SQL_KEYWORDS.set} status${SQL_OPERATORS.eq}'${RECORD_STATUS.DELETED}'${QUERY_BUILDING.delimiter} updated_at${SQL_OPERATORS.eq}${QUERY_BUILDING.parameterPlaceholder} ${SQL_KEYWORDS.where} id${SQL_OPERATORS.eq}${QUERY_BUILDING.parameterPlaceholder}` : `${SQL_KEYWORDS.update} ${tableName} ${SQL_KEYWORDS.set} status${SQL_OPERATORS.eq}'${RECORD_STATUS.DELETED}' ${SQL_KEYWORDS.where} id${SQL_OPERATORS.eq}${QUERY_BUILDING.parameterPlaceholder}`, hasUpdatedAt ? [now(), id] : [id], { entity, operation: 'SoftDelete' });
  } else {
    execRun(`${SQL_KEYWORDS.delete} ${tableName} ${SQL_KEYWORDS.where} id${SQL_OPERATORS.eq}${QUERY_BUILDING.parameterPlaceholder}`, [id], { entity, operation: 'HardDelete' });
  }
};

export { withTransaction };

export const getChildren = (parentEntity, parentId, childDef) => {
  const foreignKey = childDef.foreignKey || `${parentEntity}_id`;
  return list(childDef.entity, { [foreignKey]: parentId });
};

export const batchGetChildren = (parentEntity, parentId, childSpecs) => {
  const childEntries = Array.isArray(childSpecs) ? childSpecs : Object.entries(childSpecs);
  const queries = childEntries.map(async ([key, def]) => {
    const foreignKey = def.foreignKey || `${parentEntity}_id`;
    const results = list(def.entity, { [foreignKey]: parentId });
    return [key, results];
  });
  return Promise.all(queries).then(results => Object.fromEntries(results));
};
