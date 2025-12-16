import { validateSortField, normalizeSortDirection, createDefaultSort } from './sort-builder';
import { buildWhereClause, addSearchCondition } from './where-clause-builder';
import { buildRefJoins, buildComputedFieldJoins, addJoinsToQuery } from './join-builder';
import { addPaginationToQuery, createPaginationMetadata } from './pagination-builder';
import { getFieldHandler } from '@/lib/field-types';

export class QueryBuilder {
  constructor(spec) {
    this.spec = spec;
    this.query = {
      select: '*',
      from: spec.name,
      where: '',
      joins: [],
      sort: '',
      limit: null,
      offset: null,
    };
    this.params = {};
  }

  select(...fields) {
    if (fields.length === 0) {
      this.query.select = '*';
    } else {
      this.query.select = fields.map(f => `${this.spec.name}.${f}`).join(', ');
    }
    return this;
  }

  where(conditions, includeDeleted = false) {
    const result = buildWhereClause(conditions, this.spec, includeDeleted);
    this.query.where = result.where;
    this.params = { ...this.params, ...result.params };
    return this;
  }

  search(query, searchFields = []) {
    if (!query || !searchFields.length) return this;

    const searchResult = addSearchCondition(
      this.query,
      query,
      searchFields,
      this.spec
    );

    if (searchResult.searchCondition) {
      const whereClause = this.query.where ? `${this.query.where} AND ${searchResult.searchCondition}` : `WHERE ${searchResult.searchCondition}`;
      this.query.where = whereClause;
      this.params.search = searchResult.searchQuery;
    }

    return this;
  }

  join(...joins) {
    const newJoins = joins.flat().filter(Boolean);
    this.query.joins = [...(this.query.joins || []), ...newJoins];
    return this;
  }

  refJoins(fieldsToInclude = []) {
    const refJoins = buildRefJoins(this.spec, fieldsToInclude);
    return this.join(...refJoins);
  }

  computedFieldJoins(fieldsToInclude = []) {
    const computedJoins = buildComputedFieldJoins(this.spec, fieldsToInclude);
    return this.join(...computedJoins);
  }

  sort(field, direction = 'ASC') {
    if (!validateSortField(field, this.spec)) {
      console.warn(`[QueryBuilder] Invalid sort field: ${field}`);
      return this;
    }

    const dir = normalizeSortDirection(direction);
    this.query.sort = `ORDER BY ${field} ${dir}`;
    this.query.sortField = field;
    this.query.sortDir = dir;
    return this;
  }

  defaultSort() {
    const { field, dir } = createDefaultSort(this.spec);
    return this.sort(field, dir);
  }

  paginate(page = 1, pageSize = 20) {
    const paginated = addPaginationToQuery(this.query, page, pageSize);
    this.query = { ...this.query, ...paginated };
    return this;
  }

  limit(count) {
    this.query.limit = count;
    return this;
  }

  offset(count) {
    this.query.offset = count;
    return this;
  }

  build() {
    const parts = [];

    parts.push(`SELECT ${this.query.select}`);
    parts.push(`FROM ${this.query.from}`);

    if (this.query.joins && this.query.joins.length > 0) {
      parts.push(...this.query.joins);
    }

    if (this.query.where) {
      parts.push(this.query.where);
    }

    if (this.query.sort) {
      parts.push(this.query.sort);
    }

    if (this.query.limit) {
      parts.push(`LIMIT ${this.query.limit}`);
    }

    if (this.query.offset !== null) {
      parts.push(`OFFSET ${this.query.offset}`);
    }

    const sql = parts.join('\n');

    return {
      sql,
      params: this.params,
      metadata: {
        page: this.query.page,
        pageSize: this.query.pageSize,
        sortField: this.query.sortField,
        sortDir: this.query.sortDir,
      },
    };
  }

  buildCount() {
    const parts = [];
    parts.push(`SELECT COUNT(*) as count`);
    parts.push(`FROM ${this.query.from}`);

    if (this.query.joins && this.query.joins.length > 0) {
      parts.push(...this.query.joins);
    }

    if (this.query.where) {
      parts.push(this.query.where);
    }

    const sql = parts.join('\n');

    return {
      sql,
      params: this.params,
    };
  }

  toString() {
    const { sql } = this.build();
    return sql;
  }
}

export function createQueryBuilder(spec) {
  return new QueryBuilder(spec);
}
