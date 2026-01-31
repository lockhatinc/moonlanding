'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRealtimeData } from '@/lib/use-realtime';

export function useMessages(entityType, entityId) {
  const { data: messages, loading, error, refetch } = useRealtimeData('message', null, {
    queryParams: { entity_type: entityType, entity_id: entityId },
    pollInterval: 1000
  });

  const sendMessage = useCallback(async (content, options = {}) => {
    try {
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          content,
          is_team_only: options.is_team_only || false,
          mentions: options.mentions || []
        })
      });
      if (!res.ok) throw new Error('Failed to send message');
      await refetch();
      return await res.json();
    } catch (err) {
      throw err;
    }
  }, [entityType, entityId, refetch]);

  return {
    messages: messages || [],
    loading,
    error,
    sendMessage,
    refetch
  };
}
