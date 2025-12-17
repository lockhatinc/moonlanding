class QueryBuilder {
  constructor(table = null) {
    this.table = table;
    this.selectClauses = [];
    this.joinClauses = [];
    this.whereClauses = [];
    this.whereParams = [];
    this.groupByClauses = [];
    this.orderByClauses = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.distinctValue = false;
  }

  select(...fields) {
    this.selectClauses.push(...fields);
    return this;
  }

  selectDistinct(...fields) {
    this.distinctValue = true;
    this.selectClauses.push(...fields);
    return this;
  }

  from(table) {
    this.table = table;
    return this;
  }

  join(table, condition, type = 'LEFT') {
    this.joinClauses.push(`${type} JOIN ${table} ON ${condition}`);
    return this;
  }

  innerJoin(table, condition) {
    return this.join(table, condition, 'INNER');
  }

  leftJoin(table, condition) {
    return this.join(table, condition, 'LEFT');
  }

  rightJoin(table, condition) {
    return this.join(table, condition, 'RIGHT');
  }

  where(condition, ...params) {
    this.whereClauses.push(condition);
    this.whereParams.push(...params);
    return this;
  }

  andWhere(condition, ...params) {
    if (this.whereClauses.length === 0) {
      return this.where(condition, ...params);
    }
    this.whereClauses.push(`AND ${condition}`);
    this.whereParams.push(...params);
    return this;
  }

  orWhere(condition, ...params) {
    if (this.whereClauses.length === 0) {
      return this.where(condition, ...params);
    }
    this.whereClauses.push(`OR ${condition}`);
    this.whereParams.push(...params);
    return this;
  }

  whereIn(field, values) {
    if (values.length === 0) {
      return this.where('1=0');
    }
    const placeholders = values.map(() => '?').join(',');
    this.whereClauses.push(`${field} IN (${placeholders})`);
    this.whereParams.push(...values);
    return this;
  }

  whereNull(field) {
    this.whereClauses.push(`${field} IS NULL`);
    return this;
  }

  whereNotNull(field) {
    this.whereClauses.push(`${field} IS NOT NULL`);
    return this;
  }

  whereLike(field, value) {
    this.whereClauses.push(`${field} LIKE ?`);
    this.whereParams.push(`%${value}%`);
    return this;
  }

  groupBy(...fields) {
    this.groupByClauses.push(...fields);
    return this;
  }

  orderBy(field, direction = 'ASC') {
    this.orderByClauses.push(`${field} ${direction.toUpperCase()}`);
    return this;
  }

  orderByDesc(field) {
    return this.orderBy(field, 'DESC');
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  offset(value) {
    this.offsetValue = value;
    return this;
  }

  paginate(page = 1, pageSize = 20) {
    const p = Math.max(1, parseInt(page));
    const ps = parseInt(pageSize);
    this.offsetValue = (p - 1) * ps;
    this.limitValue = ps;
    return this;
  }

  build() {
    if (!this.table) {
      throw new Error('QueryBuilder: table must be set');
    }

    const distinct = this.distinctValue ? 'DISTINCT ' : '';
    const select = this.selectClauses.length > 0
      ? this.selectClauses.join(', ')
      : '*';

    let sql = `SELECT ${distinct}${select} FROM ${this.table}`;

    if (this.joinClauses.length > 0) {
      sql += ' ' + this.joinClauses.join(' ');
    }

    if (this.whereClauses.length > 0) {
      sql += ' WHERE ' + this.whereClauses.join(' ');
    }

    if (this.groupByClauses.length > 0) {
      sql += ' GROUP BY ' + this.groupByClauses.join(', ');
    }

    if (this.orderByClauses.length > 0) {
      sql += ' ORDER BY ' + this.orderByClauses.join(', ');
    }

    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`;
      if (this.offsetValue !== null) {
        sql += ` OFFSET ${this.offsetValue}`;
      }
    }

    return {
      sql,
      params: this.whereParams,
    };
  }

  buildSelect() {
    const { sql, params } = this.build();
    return { sql, params };
  }

  buildCount() {
    const distinct = this.distinctValue ? 'DISTINCT ' : '';
    const countField = this.selectClauses.length > 0
      ? `${distinct}${this.selectClauses[0]}`
      : `${distinct}*`;

    const sql = `SELECT COUNT(${countField}) as count FROM ${this.table}${
      this.joinClauses.length > 0 ? ' ' + this.joinClauses.join(' ') : ''
    }${
      this.whereClauses.length > 0 ? ' WHERE ' + this.whereClauses.join(' ') : ''
    }`;

    return {
      sql,
      params: this.whereParams,
    };
  }

  toString() {
    return this.build().sql;
  }
}

export default QueryBuilder;

export function createQueryBuilder(table) {
  return new QueryBuilder(table);
}
