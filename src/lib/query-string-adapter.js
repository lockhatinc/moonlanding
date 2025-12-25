async function getDefaultPageSize() {
  // Client-side: return default immediately without loading config
  if (typeof window !== 'undefined') {
    return 50;
  }

  try {
    // Use eval to prevent webpack from bundling this import on client side
    const importFunc = eval('import');
    const { getConfigEngine } = await importFunc('@/lib/config-generator-engine');
    const engine = await getConfigEngine();
    return engine.getConfig().system.pagination.default_page_size;
  } catch (error) {
    console.warn('[query-string-adapter] Failed to load config, using default page size 50');
    return 50;
  }
}

export class QueryAdapter {
  static async parse(request) {
    const { searchParams } = new URL(request.url);
    const defaultPageSize = await getDefaultPageSize();
    return {
      q: searchParams.get('q'),
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      pageSize: parseInt(searchParams.get('pageSize') || String(defaultPageSize)),
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

  static async getDefault(key) {
    const defaultPageSize = await getDefaultPageSize();
    const defaults = {
      page: 1,
      pageSize: defaultPageSize,
      sortDir: 'asc',
      limit: null,
      offset: null,
    };
    return defaults[key] ?? null;
  }

  static async fromSearchParams(searchParams, spec = null) {
    const defaultPageSize = await getDefaultPageSize();
    const get = (key) => {
      if (typeof searchParams.get === 'function') {
        return searchParams.get(key);
      }
      return searchParams[key];
    };
    return {
      q: get('q'),
      page: Math.max(1, parseInt(get('page') || '1')),
      pageSize: parseInt(get('pageSize') || String(spec?.list?.pageSize || defaultPageSize)),
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
export const fromSearchParams = (searchParams, spec) => QueryAdapter.fromSearchParams(searchParams, spec);
