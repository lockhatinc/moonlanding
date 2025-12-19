'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { POLLING_CONFIG } from '@/config/polling-config';
import { API_ENDPOINTS } from '@/config';

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
  const urlRef = useRef(null);
  const currentBackoffRef = useRef(POLLING_CONFIG.interval);

  const url = id ? API_ENDPOINTS.get(entity, id) : API_ENDPOINTS.list(entity, options.queryParams || {});
  const cacheKey = getCacheKey(url, options.queryParams);
  urlRef.current = url;

  const fetchData = useCallback(async () => {
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    const fetchPromise = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const newData = await res.json();
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
  }, [url, cacheKey, entity, retryCount]);

  const subscribe = useCallback(() => {
    if (!listeners.has(url)) {
      listeners.set(url, new Set());
    }
    listeners.get(url).add(setData);

    return () => {
      const set = listeners.get(url);
      set.delete(setData);
      if (set.size === 0) listeners.delete(url);
    };
  }, [url]);

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
  }, [url, fetchData, subscribe, options.pollInterval, cacheKey]);

  return { data, loading, error, refetch: fetchData, retryCount, currentBackoff: currentBackoffRef.current };
}

export function notifyRealtimeUpdate(entityOrUrl) {
  const isUrl = entityOrUrl.startsWith('/api/');
  const url = isUrl ? entityOrUrl : `/api/${entityOrUrl}`;

  const listeners_for_url = listeners.get(url);
  if (listeners_for_url) {
    listeners_for_url.forEach(async setData => {
      try {
        const res = await fetch(url);
        const data = await res.json();
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
          const res = await fetch(parentUrl);
          const data = await res.json();
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
