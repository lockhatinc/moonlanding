'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useApi, apiClient } from '@/lib/api-client-unified';

const POLLING_CONFIG = {
  interval: 3000,
  maxBackoff: 30000,
  backoffMultiplier: 2,
  maxRetries: 3,
};

const listeners = new Map();
const pendingRequests = new Map();
const backoffTimers = new Map();

function getCacheKey(url, queryParams) {
  if (!queryParams || Object.keys(queryParams).length === 0) return url;
  const sorted = Object.keys(queryParams).sort().map(k => `${k}=${queryParams[k]}`).join('&');
  return `${url}?${sorted}`;
}

function getCurrentBackoff(cacheKey) {
  return backoffTimers.get(cacheKey) || POLLING_CONFIG.interval;
}

function increaseBackoff(cacheKey) {
  const current = getCurrentBackoff(cacheKey);
  const next = Math.min(current * POLLING_CONFIG.backoffMultiplier, POLLING_CONFIG.maxBackoff);
  backoffTimers.set(cacheKey, next);
  return next;
}

function resetBackoff(cacheKey) {
  backoffTimers.delete(cacheKey);
}

export function useRealtimeData(entity, id, options = {}) {
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(!options.initialData);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const pollIntervalRef = useRef(null);
  const currentBackoffRef = useRef(POLLING_CONFIG.interval);
  const { execute } = useApi();

  const cacheKey = `${entity}:${id || JSON.stringify(options.queryParams || {})}`;

  const fetchData = useCallback(async () => {
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    const fetchPromise = (async () => {
      try {
        const newData = id
          ? await execute(api => api.get(entity, id))
          : await execute(api => api.list(entity, options.queryParams || {}));
        setData(newData);
        setError(null);
        setRetryCount(0);
        resetBackoff(cacheKey);
        currentBackoffRef.current = POLLING_CONFIG.interval;
        return newData;
      } catch (err) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);

        if (newRetryCount >= POLLING_CONFIG.maxRetries) {
          setError(`Failed after ${POLLING_CONFIG.maxRetries} retries: ${err.message}`);
          console.error(`Polling failed for ${entity} after ${POLLING_CONFIG.maxRetries} retries:`, err);
        } else {
          setError(err.message);
          console.error(`Failed to fetch ${entity} (retry ${newRetryCount}/${POLLING_CONFIG.maxRetries}):`, err);
        }

        const newBackoff = increaseBackoff(cacheKey);
        currentBackoffRef.current = newBackoff;

        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = setInterval(fetchData, newBackoff);
        }

        throw err;
      } finally {
        setLoading(false);
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, [cacheKey, entity, id, options.queryParams, retryCount, execute]);

  const subscribe = useCallback(() => {
    if (!listeners.has(cacheKey)) {
      listeners.set(cacheKey, new Set());
    }
    listeners.get(cacheKey).add(setData);

    return () => {
      const set = listeners.get(cacheKey);
      set.delete(setData);
      if (set.size === 0) listeners.delete(cacheKey);
    };
  }, [cacheKey]);

  useEffect(() => {
    fetchData();
    const unsubscribe = subscribe();

    const interval = options.pollInterval || POLLING_CONFIG.interval;
    pollIntervalRef.current = setInterval(fetchData, interval);

    return () => {
      clearInterval(pollIntervalRef.current);
      unsubscribe();
      pendingRequests.delete(cacheKey);
    };
  }, [cacheKey, fetchData, subscribe, options.pollInterval]);

  return { data, loading, error, refetch: fetchData, retryCount, currentBackoff: currentBackoffRef.current };
}

export function notifyRealtimeUpdate(entityOrUrl) {
  const isUrl = entityOrUrl.startsWith('/api/');
  const url = isUrl ? entityOrUrl : `/api/${entityOrUrl}`;

  const listeners_for_url = listeners.get(url);
  if (listeners_for_url) {
    listeners_for_url.forEach(async setData => {
      try {
        const data = await apiClient.request({ method: 'GET', endpoint: url });
        setData(data);
      } catch (err) {
        console.error('Realtime update error:', err);
      }
    });
  }

  const parentUrl = extractParentUrl(url);
  if (parentUrl && parentUrl !== url) {
    const parentListeners = listeners.get(parentUrl);
    if (parentListeners) {
      parentListeners.forEach(async setData => {
        try {
          const data = await apiClient.request({ method: 'GET', endpoint: parentUrl });
          setData(data);
        } catch (err) {
          console.error('Parent list update error:', err);
        }
      });
    }
  }
}

function extractParentUrl(url) {
  const parts = url.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'api') {
    return `/${parts[0]}/${parts[1]}`;
  }
  return null;
}
