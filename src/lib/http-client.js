const DEFAULT_TIMEOUT = 30000;

class HttpClient {
  constructor(timeout = DEFAULT_TIMEOUT) {
    this.timeout = timeout;
    this.defaultHeaders = { 'Content-Type': 'application/json' };
  }

  async request(method, url, options = {}) {
    const { body, headers = {}, timeout = this.timeout, ...fetchOptions } = options;

    try {
      const fetchOpts = {
        method,
        headers: { ...this.defaultHeaders, ...headers },
        ...fetchOptions,
      };

      if (body) fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, { ...fetchOpts, signal: controller.signal });
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const error = new Error(data?.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`[HTTP] ${method} ${url}:`, error);
      throw error;
    }
  }

  get(url, options = {}) {
    return this.request('GET', url, options);
  }

  post(url, body, options = {}) {
    return this.request('POST', url, { body, ...options });
  }

  put(url, body, options = {}) {
    return this.request('PUT', url, { body, ...options });
  }

  patch(url, body, options = {}) {
    return this.request('PATCH', url, { body, ...options });
  }

  delete(url, options = {}) {
    return this.request('DELETE', url, options);
  }

  buildUrl(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined) query.append(k, v);
    });
    return query.toString() ? `${endpoint}?${query.toString()}` : endpoint;
  }
}

export const httpClient = new HttpClient();
export const createHttpClient = (timeout) => new HttpClient(timeout);
