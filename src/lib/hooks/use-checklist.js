'use client';

import { useState, useCallback, useEffect } from 'react';

export function useChecklist(checklistId, reviewId) {
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/checklist/${checklistId}`);
      if (!res.ok) throw new Error('Failed to fetch checklist items');
      const data = await res.json();
      setItems(data.items || []);
      const completed = data.items?.filter(i => i.completed).length || 0;
      setProgress(data.items?.length ? Math.round((completed / data.items.length) * 100) : 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [checklistId, reviewId]);

  useEffect(() => {
    if (checklistId && reviewId) fetchItems();
  }, [checklistId, reviewId, fetchItems]);

  const addItem = useCallback(async (text) => {
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/checklist/${checklistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('Failed to add item');
      await fetchItems();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [checklistId, reviewId, fetchItems]);

  const toggleItem = useCallback(async (itemId) => {
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/checklist/${checklistId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !items.find(i => i.id === itemId)?.completed })
      });
      if (!res.ok) throw new Error('Failed to toggle item');
      await fetchItems();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [checklistId, reviewId, items, fetchItems]);

  const deleteItem = useCallback(async (itemId) => {
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/checklist/${checklistId}/items/${itemId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete item');
      await fetchItems();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [checklistId, reviewId, fetchItems]);

  return {
    items,
    progress,
    loading,
    error,
    addItem,
    toggleItem,
    deleteItem,
    refetch: fetchItems,
    setError
  };
}
