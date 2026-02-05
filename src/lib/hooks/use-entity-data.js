import { useState, useEffect, useCallback } from 'react';

export function useEntityData(entityName, parentId = null, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const {
    deps = [],
    initialData = [],
    skipFetch = false,
    autoRefetch = true,
  } = options;

  const buildUrl = useCallback(() => {
    let url = `/api/${entityName}`;
    if (parentId && options.parentEntity) {
      url = `/api/${options.parentEntity}/${parentId}/${entityName}`;
    }
    return url;
  }, [entityName, parentId, options.parentEntity]);

  const fetch = useCallback(async () => {
    if (skipFetch) {
      setData(initialData);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = buildUrl();
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${entityName}`);
      const json = await response.json();
      setData(json.data || json || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [buildUrl, entityName, skipFetch, initialData]);

  useEffect(() => {
    fetch();
  }, [fetch, entityName, parentId, ...deps]);

  const create = useCallback(async (payload) => {
    try {
      const url = buildUrl();
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Failed to create ${entityName}`);
      const json = await response.json();
      const newItem = json.data || json;
      setData(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [buildUrl, entityName]);

  const update = useCallback(async (id, payload) => {
    try {
      let url = `/api/${entityName}/${id}`;
      if (parentId && options.parentEntity) {
        url = `/api/${options.parentEntity}/${parentId}/${entityName}/${id}`;
      }
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Failed to update ${entityName}`);
      const json = await response.json();
      const updated = json.data || json;
      setData(prev => prev.map(item => item.id === id ? updated : item));
      return updated;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [entityName, parentId, options.parentEntity]);

  const remove = useCallback(async (id) => {
    try {
      let url = `/api/${entityName}/${id}`;
      if (parentId && options.parentEntity) {
        url = `/api/${options.parentEntity}/${parentId}/${entityName}/${id}`;
      }
      const response = await fetch(url, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Failed to delete ${entityName}`);
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [entityName, parentId, options.parentEntity]);

  const refetch = useCallback(fetch, [fetch]);

  return {
    data,
    setData,
    loading,
    error,
    create,
    update,
    delete: remove,
    refetch,
  };
}
