import { PAGINATION } from '@/config/pagination-constants';

export class QueryAdapter {
  static parse(request) {
    const { searchParams } = new URL(request.url);
    return {
      q: searchParams.get('q'),
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      pageSize: parseInt(searchParams.get('pageSize') || String(PAGINATION.defaultPageSize)),
      action: searchParams.get('action'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sort: searchParams.get('sort'),
      sortDir: searchParams.get('sortDir'),
      filters: QueryAdapter.extractFilters(searchParams),
    };
  }

  static extractFilters(searchParams) {
    const filters = {};
    const reserved = new Set(['q', 'page', 'pageSize', 'action', 'limit', 'offset', 'sort', 'sortDir']);
    for (const [key, value] of searchParams) {
      if (!reserved.has(key) && value) {
        filters[key] = value;
      }
    }
    return filters;
  }

  static build(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .forEach(([k, v]) => query.append(k, v));
    return query;
  }

  static buildUrl(baseUrl, params = {}) {
    const queryString = QueryAdapter.build(params).toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  static getDefault(key) {
    const defaults = {
      page: 1,
      pageSize: PAGINATION.defaultPageSize,
      sortDir: 'asc',
      limit: null,
      offset: null,
    };
    return defaults[key] ?? null;
  }

  static fromSearchParams(searchParams, spec = null) {
    return {
      q: searchParams.get('q'),
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      pageSize: parseInt(searchParams.get('pageSize') || String(spec?.list?.pageSize || PAGINATION.defaultPageSize)),
    };
  }

  static toQueryString(params = {}) {
    return QueryAdapter.build(params).toString();
  }
}

export const parse = (request) => QueryAdapter.parse(request);
export const build = (params) => QueryAdapter.build(params);
export const buildUrl = (baseUrl, params) => QueryAdapter.buildUrl(baseUrl, params);
export const getDefault = (key) => QueryAdapter.getDefault(key);
