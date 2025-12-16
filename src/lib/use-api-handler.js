'use client';

import { useState } from 'react';

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

export function useApiGet(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const { loading, error, execute } = useApiHandler(endpoint, {
    method: 'GET',
    onSuccess: setData,
    ...options,
  });

  return { loading, error, data, refetch: execute };
}

export function useApiPost(endpoint, options = {}) {
  return useApiHandler(endpoint, { method: 'POST', ...options });
}

export function useApiPut(endpoint, options = {}) {
  return useApiHandler(endpoint, { method: 'PUT', ...options });
}

export function useApiDelete(endpoint, options = {}) {
  return useApiHandler(endpoint, { method: 'DELETE', ...options });
}
