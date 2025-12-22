'use client';

import { useState, useCallback, useEffect } from 'react';

class UnifiedApiClient {
  constructor() {
    this.requestCache = new Map();
    this.requestQueue = new Map();
    this.activeRequests = new Map();
    this.interceptors = { request: [], response: [], error: [] };
    this.cacheMaxSize = 100;
  }

  addInterceptor(type, fn) {
    if (this.interceptors[type]) {
      this.interceptors[type].push(fn);
    }
  }

  async request(config) {
    const cacheKey = `${config.method || 'GET'}:${config.endpoint}:${JSON.stringify(config.params || {})}`;

    if (config.method === 'GET' && this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey);
    }

    if (this.requestQueue.has(cacheKey) && config.method === 'GET') {
      return this.requestQueue.get(cacheKey);
    }

    const requestPromise = this.executeRequest(config);

    if (config.method === 'GET') {
      this.requestQueue.set(cacheKey, requestPromise);
    }

    try {
      const response = await requestPromise;
      if (config.method === 'GET' && config.cache !== false) {
        this.requestCache.set(cacheKey, response);
        if (this.requestCache.size > this.cacheMaxSize) {
          const firstKey = this.requestCache.keys().next().value;
          this.requestCache.delete(firstKey);
        }
      }
      return response;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  async executeRequest(config) {
    const { method = 'GET', endpoint, params = {}, data = null, headers = {} } = config;
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(params || {})}`;
    const controller = new AbortController();
    this.activeRequests.set(cacheKey, controller);

    for (const fn of this.interceptors.request) {
      config = (await fn(config)) || config;
    }

    const fetchOptions = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      signal: controller.signal,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(data);
    }

    let url = endpoint;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) searchParams.append(key, value);
      });
      url = `${endpoint}?${searchParams.toString()}`;
    }

    try {
      const res = await fetch(url, fetchOptions);

      if (!res.ok) {
        const error = new Error(res.statusText || 'API request failed');
        error.status = res.status;
        error.response = res;

        for (const fn of this.interceptors.error) {
          await fn(error);
        }

        throw error;
      }

      const json = await res.json();

      for (const fn of this.interceptors.response) {
        return (await fn(json)) || json;
      }

      return json;
    } catch (err) {
      for (const fn of this.interceptors.error) {
        await fn(err);
      }
      throw err;
    } finally {
      this.activeRequests.delete(cacheKey);
    }
  }

  list(entity, params = {}) {
    return this.request({ method: 'GET', endpoint: `/api/${entity}`, params });
  }

  get(entity, id) {
    return this.request({ method: 'GET', endpoint: `/api/${entity}/${id}` });
  }

  create(entity, data) {
    return this.request({ method: 'POST', endpoint: `/api/${entity}`, data });
  }

  update(entity, id, data) {
    return this.request({ method: 'PUT', endpoint: `/api/${entity}/${id}`, data });
  }

  delete(entity, id) {
    return this.request({ method: 'DELETE', endpoint: `/api/${entity}/${id}` });
  }

  clearCache() {
    this.requestCache.clear();
  }

  getCacheStats() {
    return { size: this.requestCache.size, keys: Array.from(this.requestCache.keys()) };
  }

  cancelPendingRequests() {
    for (const controller of this.activeRequests.values()) {
      controller.abort();
    }
    this.activeRequests.clear();
  }
}

const apiClient = new UnifiedApiClient();

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(apiClient);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, []);

  useEffect(() => {
    return () => apiClient.cancelPendingRequests();
  }, []);

  return { execute, loading, error, apiClient };
}

export { apiClient };
