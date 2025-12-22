export const SQL_OPERATORS = {
  eq: '=',
  ne: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  like: 'LIKE',
  in: 'IN',
  notIn: 'NOT IN',
  between: 'BETWEEN',
  isNull: 'IS NULL',
  isNotNull: 'IS NOT NULL',
};

export const QUERY_PATTERNS = {
  list: 'SELECT * FROM {table} WHERE {conditions} ORDER BY {orderBy} LIMIT {limit} OFFSET {offset}',
  get: 'SELECT * FROM {table} WHERE id = ?',
  count: 'SELECT COUNT(*) as count FROM {table} WHERE {conditions}',
  create: 'INSERT INTO {table} ({fields}) VALUES ({values})',
  update: 'UPDATE {table} SET {assignments} WHERE id = ?',
  delete: 'UPDATE {table} SET status = "deleted" WHERE id = ?',
  search: 'SELECT * FROM {table} WHERE {searchConditions} ORDER BY {orderBy} LIMIT {limit}',
};

export const DEFAULT_LIMITS = {
  list: 100,
  search: 50,
  export: 1000,
  max: 10000,
};

export const QUERY_DEFAULTS = {
  pageSize: 20,
  offset: 0,
  orderBy: 'created_at DESC',
  timeout: 30000,
};

export const FIELD_TYPES = {
  text: 'TEXT',
  number: 'INTEGER',
  decimal: 'REAL',
  boolean: 'BOOLEAN',
  date: 'INTEGER',
  json: 'TEXT',
  reference: 'TEXT',
};

export const SQL_KEYWORDS = {
  select: 'SELECT',
  from: 'FROM',
  where: 'WHERE',
  orderBy: 'ORDER BY',
  groupBy: 'GROUP BY',
  having: 'HAVING',
  limit: 'LIMIT',
  offset: 'OFFSET',
  join: 'LEFT JOIN',
  innerJoin: 'INNER JOIN',
  leftJoin: 'LEFT JOIN',
  rightJoin: 'RIGHT JOIN',
  union: 'UNION',
  unionAll: 'UNION ALL',
  distinct: 'DISTINCT',
  count: 'COUNT(*)',
  countAs: 'COUNT(*) as',
  as: 'as',
  and: 'AND',
  or: 'OR',
  not: 'NOT',
  insert: 'INSERT INTO',
  update: 'UPDATE',
  delete: 'DELETE FROM',
  set: 'SET',
  values: 'VALUES',
};

export const QUERY_BUILDING = {
  parameterPlaceholder: '?',
  wildcard: '%',
  delimiter: ',',
  statementEnd: ';',
};

export const SORT_DIRECTIONS = {
  asc: 'ASC',
  desc: 'DESC',
  ascending: 'ASC',
  descending: 'DESC',
};

export const AGGREGATE_FUNCTIONS = {
  count: 'COUNT',
  sum: 'SUM',
  avg: 'AVG',
  min: 'MIN',
  max: 'MAX',
  groupConcat: 'GROUP_CONCAT',
};
