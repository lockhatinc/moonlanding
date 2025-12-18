import { buildUrl, createFetchOptions, parseResponse } from './fetch-utils';

const DEFAULT_TIMEOUT = 30000;

class HttpClient {
  constructor(timeout = DEFAULT_TIMEOUT) {
    this.timeout = timeout;
  }

  async request(method, url, options = {}) {
    const { body, headers = {}, timeout = this.timeout } = options;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...createFetchOptions(method, body, headers),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      return parseResponse(response);
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
    return buildUrl(endpoint, params);
  }
}

export const httpClient = new HttpClient();
export const createHttpClient = (timeout) => new HttpClient(timeout);
