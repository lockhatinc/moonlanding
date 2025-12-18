/**
 * Fetch utilities for common patterns
 * Consolidates URLSearchParams building and fetch patterns
 */

export const buildParams = (obj = {}) => {
  const params = new URLSearchParams();
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .forEach(([k, v]) => params.append(k, v));
  return params;
};

export const buildUrl = (baseUrl, params) => {
  const queryString = buildParams(params).toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const jsonHeaders = {
  'Content-Type': 'application/json',
};

export const formHeaders = {
  'Content-Type': 'multipart/form-data',
};

// Common fetch options factory
export const createFetchOptions = (method = 'GET', body = null, headers = {}) => ({
  method,
  headers: { ...jsonHeaders, ...headers },
  ...(body && { body: typeof body === 'string' ? body : JSON.stringify(body) }),
});

// Handle response parsing with error checking
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

// Consolidated fetch wrapper
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
