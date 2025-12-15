'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

const POLL_INTERVAL = 3000;
const listeners = new Map();

export function useRealtimeData(entity, id, options = {}) {
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(!options.initialData);
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);
  const urlRef = useRef(null);

  const url = id ? `/api/${entity}/${id}` : `/api/${entity}`;
  urlRef.current = url;

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newData = await res.json();
      setData(newData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error(`Failed to fetch ${entity}:`, err);
    } finally {
      setLoading(false);
    }
  }, [url, entity]);

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

    pollIntervalRef.current = setInterval(fetchData, options.pollInterval || POLL_INTERVAL);

    return () => {
      clearInterval(pollIntervalRef.current);
      unsubscribe();
    };
  }, [url, fetchData, subscribe, options.pollInterval]);

  return { data, loading, error, refetch: fetchData };
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
