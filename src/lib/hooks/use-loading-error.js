'use client';

import { useState, useCallback } from 'react';

export const useLoadingError = (initialLoading = false) => {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => setLoading(false), []);

  const setErrorAndStop = useCallback((err) => {
    setError(err);
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { loading, error, setLoading, setError, startLoading, stopLoading, setErrorAndStop, reset };
};
