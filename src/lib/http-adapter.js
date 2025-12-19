import { build as buildQuery, buildUrl } from '@/lib/query-string-adapter';

export async function fetchApiCall(method, endpoint, data = null, options = {}) {
  const { params = {}, responseTransform = null, logContext = '' } = options;

  try {
    const url = buildUrl(endpoint, params);

    const fetchOptions = {
      method,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      fetchOptions.headers = { 'Content-Type': 'application/json' };
      fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, fetchOptions);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    if (json.status !== 'success') throw new Error(json.message);

    if (responseTransform) {
      return responseTransform(json.data);
    }

    return json.data;
  } catch (e) {
    console.error(`[DataLayer] ${logContext}:`, e);
    throw e;
  }
}

export function buildQueryParams(where = {}, options = {}) {
  const params = { ...where };

  if (options.limit) params.limit = options.limit;
  if (options.offset) params.offset = options.offset;
  if (options.page) params.page = options.page;
  if (options.pageSize) params.pageSize = options.pageSize;
  if (options.q) params.q = options.q;

  if (options.sort) {
    params.sort = options.sort.field;
    params.sortDir = options.sort.dir;
  }

  return params;
}
