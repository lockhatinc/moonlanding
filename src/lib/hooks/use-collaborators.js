'use client';

import { useState, useCallback, useEffect } from 'react';

export function useCollaborators(reviewId) {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCollaborators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/collaborators`);
      if (!res.ok) throw new Error('Failed to fetch collaborators');
      const data = await res.json();
      setCollaborators(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    if (reviewId) fetchCollaborators();
  }, [reviewId, fetchCollaborators]);

  const addCollaborator = useCallback(async (email, expiryDays) => {
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, expiryDays: expiryDays || null })
      });
      if (!res.ok) throw new Error('Failed to add collaborator');
      await fetchCollaborators();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [reviewId, fetchCollaborators]);

  const removeCollaborator = useCallback(async (collaboratorId) => {
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/collaborators/${collaboratorId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to remove collaborator');
      await fetchCollaborators();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [reviewId, fetchCollaborators]);

  return {
    collaborators,
    loading,
    error,
    addCollaborator,
    removeCollaborator,
    refetch: fetchCollaborators,
    setError
  };
}
