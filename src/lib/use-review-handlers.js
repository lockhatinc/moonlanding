'use client';

import { useRouter } from 'next/navigation';

export function useReviewHandlers(dataId) {
  const router = useRouter();

  const apiCall = async (endpoint, method, body) => {
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      router.refresh();
      return res.ok ? (method !== 'DELETE' ? await res.json() : null) : null;
    } catch (e) {
      console.error(`[REVIEW] ${method} ${endpoint}:`, e.message);
      throw e;
    }
  };

  return {
    handleHighlight: (d) => apiCall('/api/highlight', 'POST', { review_id: dataId, ...d }),
    handleResolve: (id) => apiCall(`/api/highlight/${id}`, 'PUT', { resolved: true }),
    handleAddResponse: (id, content) => apiCall('/api/highlight_response', 'POST', { highlight_id: id, content }),
    handleSendMessage: (message) => apiCall('/api/chat', 'POST', message),
  };
}
