'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800'
};

const STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  in_progress: 'In Progress',
  completed: 'Completed'
};

export function RfiList({ engagementId, onSelect }) {
  const router = useRouter();
  const [rfis, setRfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadRfis();
  }, [filter, page]);

  const loadRfis = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/rfi', window.location.origin);
      if (engagementId) url.searchParams.append('engagement_id', engagementId);
      if (filter !== 'all') url.searchParams.append('status', filter);
      url.searchParams.append('page', page);
      url.searchParams.append('limit', 20);

      const res = await fetch(url.toString());
      const data = await res.json();
      setRfis(data.data || []);
    } catch (err) {
      console.error('Failed to load RFIs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rfiId) => {
    if (!confirm('Delete this RFI?')) return;
    try {
      const res = await fetch(`/api/rfi/${rfiId}`, { method: 'DELETE' });
      if (res.ok) {
        loadRfis();
      }
    } catch (err) {
      console.error('Failed to delete RFI:', err);
    }
  };

  if (loading && !rfis.length) {
    return <div className="h-40 bg-gray-200 rounded animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setFilter(key); setPage(1); }}
            className={`px-3 py-1 rounded text-sm font-medium ${
              filter === key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => { setFilter('all'); setPage(1); }}
          className={`px-3 py-1 rounded text-sm font-medium ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
      </div>

      <div className="space-y-2">
        {rfis.map(rfi => (
          <div
            key={rfi.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => onSelect ? onSelect(rfi.id) : router.push(`/rfi/${rfi.id}`)}
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    RFI for {rfi.engagement_id}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[rfi.status]}`}>
                    {STATUS_LABELS[rfi.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Created: {new Date(rfi.created_at * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/rfi/${rfi.id}`)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  View
                </button>
                <button
                  onClick={() => handleDelete(rfi.id)}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rfis.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No RFIs found. Create one to get started.
        </div>
      )}
    </div>
  );
}
