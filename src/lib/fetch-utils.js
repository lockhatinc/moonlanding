import { build as buildQuery, buildUrl as buildUrlQuery } from '@/lib/query-string-adapter';

export const buildParams = buildQuery;
export const buildUrl = buildUrlQuery;

export const jsonHeaders = {
  'Content-Type': 'application/json',
};

export const formHeaders = {
  'Content-Type': 'multipart/form-data',
};

export const createFetchOptions = (method = 'GET', body = null, headers = {}) => ({
  method,
  headers: { ...jsonHeaders, ...headers },
  ...(body && { body: typeof body === 'string' ? body : JSON.stringify(body) }),
});

export const parseResponse = async (response, expectJson = true) => {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const body = isJson ? await response.json() : await response.text();
    const error = new Error(body?.message || body || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = body;
    throw error;
  }

  if (!expectJson) return response;

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return response.text();
  }
  return response.json();
};

export const fetchJson = async (url, options = {}) => {
  const { method = 'GET', body = null, headers = {}, signal = null } = options;
  const response = await fetch(url, {
    method,
    headers: { ...jsonHeaders, ...headers },
    signal,
    ...(body && { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
  return parseResponse(response, true);
};

export const fetchText = async (url, options = {}) => {
  const response = await fetch(url, options);
  return parseResponse(response, false);
};
