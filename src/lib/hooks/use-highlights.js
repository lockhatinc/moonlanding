'use client';

import { useState, useCallback, useEffect } from 'react';

export function useHighlights(reviewId) {
  const [highlights, setHighlights] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHighlights = useCallback(async () => {
    if (!reviewId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/review/${reviewId}/highlight`);
      if (!res.ok) throw new Error('Failed to fetch highlights');
      const json = await res.json();
      setHighlights(json.data || json || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  const saveHighlight = useCallback(async (data) => {
    setError(null);
    const isUpdate = !!data.id;
    const url = isUpdate ? `/api/review/${reviewId}/highlight/${data.id}` : `/api/review/${reviewId}/highlight`;
    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save highlight');
    const json = await res.json();
    const saved = json.data || json;
    setHighlights(prev => isUpdate ? prev.map(h => h.id === saved.id ? saved : h) : [...prev, saved]);
    return saved;
  }, [reviewId]);

  const deleteHighlight = useCallback(async (highlightId) => {
    setError(null);
    const res = await fetch(`/api/review/${reviewId}/highlight/${highlightId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete highlight');
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
  }, [reviewId]);

  const resolveHighlight = useCallback(async (highlightId, resolutionNotes) => {
    return saveHighlight({ id: highlightId, status: 'resolved', resolution_notes: resolutionNotes, resolved_at: Math.floor(Date.now() / 1000) });
  }, [saveHighlight]);

  const reopenHighlight = useCallback(async (highlightId) => {
    return saveHighlight({ id: highlightId, status: 'unresolved', resolution_notes: null, resolved_at: null });
  }, [saveHighlight]);

  const addResponse = useCallback(async (highlightId, content) => {
    const res = await fetch(`/api/review/${reviewId}/highlight/${highlightId}/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to add response');
    await fetchHighlights();
  }, [reviewId, fetchHighlights]);

  const selected = highlights.find(h => h.id === selectedId) || null;

  return {
    highlights,
    setHighlights,
    selectedId,
    setSelectedId,
    selected,
    loading,
    error,
    setError,
    fetchHighlights,
    saveHighlight,
    deleteHighlight,
    resolveHighlight,
    reopenHighlight,
    addResponse,
  };
}
