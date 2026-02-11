'use client';

import { useState, useCallback, useRef } from 'react';

let globalLoadingCount = 0;
let globalListeners = new Set();

function notifyListeners() {
  const isLoading = globalLoadingCount > 0;
  globalListeners.forEach(fn => fn(isLoading));
}

export function useGlobalLoading() {
  const [isLoading, setIsLoading] = useState(globalLoadingCount > 0);
  const listenerRef = useRef(null);

  if (!listenerRef.current) {
    listenerRef.current = (loading) => setIsLoading(loading);
    globalListeners.add(listenerRef.current);
  }

  const startLoading = useCallback(() => {
    globalLoadingCount++;
    notifyListeners();
  }, []);

  const stopLoading = useCallback(() => {
    globalLoadingCount = Math.max(0, globalLoadingCount - 1);
    notifyListeners();
  }, []);

  const withLoading = useCallback(async (fn) => {
    startLoading();
    try {
      return await fn();
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return { isLoading, startLoading, stopLoading, withLoading };
}
