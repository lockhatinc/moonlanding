import { useState, useCallback } from 'react';

export function useAsync(initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const start = useCallback(async (promise) => {
    setLoading(true);
    setError(null);
    try {
      const result = await promise;
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setSuccess = useCallback((result) => {
    setData(result);
    setError(null);
    setLoading(false);
  }, []);

  const setFailed = useCallback((err) => {
    setError(err);
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return {
    data,
    setData,
    loading,
    error,
    start,
    setSuccess,
    setFailed,
    reset,
  };
}
