'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/api-client-unified';

export function useReviewHandlers(dataId) {
  const router = useRouter();
  const { execute } = useApi();

  const handleHighlight = useCallback((d) =>
    execute(api => api.create('highlight', { review_id: dataId, ...d })).then(() => router.refresh()),
    [dataId, execute]
  );

  const handleResolve = useCallback((id) =>
    execute(api => api.update('highlight', id, { resolved: true })).then(() => router.refresh()),
    [execute]
  );

  const handleAddResponse = useCallback((id, content) =>
    execute(api => api.create('highlight_response', { highlight_id: id, content })).then(() => router.refresh()),
    [execute]
  );

  const handleSendMessage = useCallback((message) =>
    execute(api => api.create('chat', message)).then(() => router.refresh()),
    [execute]
  );

  return { handleHighlight, handleResolve, handleAddResponse, handleSendMessage };
}
