import React, { useState, useEffect } from 'react';

export function AuditTrail({ entityType, entityId, userId, action, fromDate, toDate, page, pageSize = 50 }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (entityType) params.append('entityType', entityType);
        if (entityId) params.append('entityId', entityId);
        if (userId) params.append('userId', userId);
        if (action) params.append('action', action);
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        params.append('page', page || 1);
        params.append('pageSize', pageSize);

        const response = await fetch(`/api/audit?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch audit logs');
        const data = await response.json();
        setLogs(data.data || []);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [entityType, entityId, userId, action, fromDate, toDate, page, pageSize]);

  if (loading) return <div className="p-4">Loading audit trail...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="border rounded">
        {logs.length === 0 ? (
          <div className="p-4 text-gray-500">No audit logs found</div>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getActionColor(log.action)}`}>
                        {log.action.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600">
                        {log.entityType} {log.entityId}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      By {log.userId || 'System'} • {formatDate(log.createdAt)}
                    </div>
                    {log.changes && log.changes.length > 0 && (
                      <div className="mt-3 space-y-1 text-sm">
                        {log.changes.map((change, idx) => (
                          <div key={idx} className="text-gray-700">
                            <span className="font-medium">{change.field}:</span>
                            {change.from !== null && change.from !== undefined && (
                              <span className="text-red-600 line-through ml-1">{formatValue(change.from)}</span>
                            )}
                            {change.to !== null && change.to !== undefined && (
                              <span className="text-green-600 ml-1">→ {formatValue(change.to)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
        </div>
      )}
    </div>
  );
}

function getActionColor(action) {
  switch (action) {
    case 'create':
      return 'bg-green-100 text-green-700';
    case 'update':
      return 'bg-blue-100 text-blue-700';
    case 'delete':
    case 'archive':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

function formatValue(value) {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'object') return JSON.stringify(value).substring(0, 50) + '...';
  return String(value).substring(0, 50);
}
