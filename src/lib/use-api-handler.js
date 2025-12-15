'use client';

import { useState } from 'react';

/**
 * Hook for handling API calls with standardized error handling
 * @param {string} endpoint - API endpoint URL
 * @param {Object} options - configuration
 * @param {string} options.method - HTTP method (default: GET)
 * @param {string} options.errorMsg - User-friendly error message
 * @param {Function} options.onSuccess - Callback on success
 * @param {Function} options.onError - Callback on error
 * @param {boolean} options.json - Parse response as JSON (default: true)
 * @returns {Object} { loading, error, execute }
 */
export function useApiHandler(endpoint, options = {}) {
  const {
    method = 'GET',
    errorMsg = 'Operation failed',
    onSuccess = null,
    onError = null,
    json = true,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (data = null) => {
    setLoading(true);
    setError(null);
    try {
      const fetchOptions = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(data);
      }

      const res = await fetch(endpoint, fetchOptions);
      if (!res.ok) throw new Error(res.statusText || errorMsg);

      const result = json ? await res.json() : await res.text();
      setLoading(false);

      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const errMsg = err.message || errorMsg;
      setError(errMsg);
      setLoading(false);

      console.error(`[API] ${method} ${endpoint}:`, errMsg);
      if (onError) onError(err);

      throw err;
    }
  };

  return { loading, error, execute };
}

/**
 * Simplified hook for read-only GET requests
 * @param {string} endpoint - API endpoint URL
 * @param {Object} options - configuration (same as useApiHandler)
 * @returns {Object} { loading, error, data, refetch }
 */
export function useApiGet(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const { loading, error, execute } = useApiHandler(endpoint, {
    method: 'GET',
    onSuccess: setData,
    ...options,
  });

  return { loading, error, data, refetch: execute };
}

/**
 * Hook for POST requests
 * @param {string} endpoint - API endpoint URL
 * @param {Object} options - configuration
 * @returns {Object} { loading, error, execute }
 */
export function useApiPost(endpoint, options = {}) {
  return useApiHandler(endpoint, { method: 'POST', ...options });
}

/**
 * Hook for PUT requests
 * @param {string} endpoint - API endpoint URL
 * @param {Object} options - configuration
 * @returns {Object} { loading, error, execute }
 */
export function useApiPut(endpoint, options = {}) {
  return useApiHandler(endpoint, { method: 'PUT', ...options });
}

/**
 * Hook for DELETE requests
 * @param {string} endpoint - API endpoint URL
 * @param {Object} options - configuration
 * @returns {Object} { loading, error, execute }
 */
export function useApiDelete(endpoint, options = {}) {
  return useApiHandler(endpoint, { method: 'DELETE', ...options });
}
