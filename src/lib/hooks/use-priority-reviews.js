'use client';

import { useState, useCallback, useEffect } from 'react';

export function usePriorityReviews(userId) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mwr/user/${userId}/priority-reviews`);
      if (!res.ok) throw new Error('Failed to fetch priority reviews');
      const data = await res.json();
      setReviews(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchReviews();
  }, [userId, fetchReviews]);

  const addPriority = useCallback(async (reviewId) => {
    try {
      const res = await fetch(`/api/mwr/user/${userId}/priority-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId })
      });
      if (!res.ok) throw new Error('Failed to add priority review');
      await fetchReviews();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [userId, fetchReviews]);

  const removePriority = useCallback(async (reviewId) => {
    try {
      const res = await fetch(`/api/mwr/user/${userId}/priority-reviews/${reviewId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to remove priority review');
      await fetchReviews();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [userId, fetchReviews]);

  const reorderPriorities = useCallback(async (orderedIds) => {
    try {
      const res = await fetch(`/api/mwr/user/${userId}/priority-reviews/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds })
      });
      if (!res.ok) throw new Error('Failed to reorder priorities');
      await fetchReviews();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [userId, fetchReviews]);

  return {
    reviews,
    loading,
    error,
    addPriority,
    removePriority,
    reorderPriorities,
    refetch: fetchReviews,
    setError
  };
}
