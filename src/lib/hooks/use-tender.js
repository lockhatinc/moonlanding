'use client';

import { useState, useCallback, useEffect } from 'react';

export function useTender(tenderId, reviewId) {
  const [tender, setTender] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTender = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/tender/${tenderId}`);
      if (!res.ok) throw new Error('Failed to fetch tender');
      const data = await res.json();
      setTender(data);

      if (data.deadline) {
        const deadline = new Date(data.deadline * 1000);
        const today = new Date();
        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        setDaysRemaining(Math.max(0, daysLeft));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenderId, reviewId]);

  useEffect(() => {
    if (tenderId && reviewId) fetchTender();

    const interval = setInterval(() => {
      fetchTender();
    }, 60000);

    return () => clearInterval(interval);
  }, [tenderId, reviewId, fetchTender]);

  return {
    tender,
    daysRemaining,
    loading,
    error,
    refetch: fetchTender,
    setError
  };
}
