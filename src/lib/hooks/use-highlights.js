'use client';

import { useState, useCallback, useEffect } from 'react';

export function useHighlights(reviewId) {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHighlights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/highlights`);
      if (!res.ok) throw new Error('Failed to fetch highlights');
      const data = await res.json();
      setHighlights(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    if (reviewId) fetchHighlights();
  }, [reviewId, fetchHighlights]);

  const saveHighlight = useCallback(async (highlightData) => {
    try {
      const method = highlightData.id ? 'PATCH' : 'POST';
      const url = highlightData.id
        ? `/api/mwr/review/${reviewId}/highlights/${highlightData.id}`
        : `/api/mwr/review/${reviewId}/highlights`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(highlightData)
      });
      if (!res.ok) throw new Error('Failed to save highlight');
      await fetchHighlights();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [reviewId, fetchHighlights]);

  const deleteHighlight = useCallback(async (highlightId) => {
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/highlights/${highlightId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete highlight');
      await fetchHighlights();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [reviewId, fetchHighlights]);

  return {
    highlights,
    loading,
    error,
    saveHighlight,
    deleteHighlight,
    refetch: fetchHighlights,
    setError
  };
}
