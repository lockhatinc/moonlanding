'use client';

import { useCallback } from 'react';

export function useHighlightReactions(reviewId) {
  const addReaction = useCallback(async (highlightId, emoji) => {
    try {
      const res = await fetch(`/api/highlight/${highlightId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
      if (!res.ok) throw new Error('Failed to add reaction');
      return await res.json();
    } catch (err) {
      console.error('Failed to add reaction:', err);
      throw err;
    }
  }, []);

  return { addReaction };
}
