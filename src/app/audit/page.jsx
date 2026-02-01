'use client';

import React, { useState, useEffect } from 'react';
import { AuditTrail } from '@/components/audit-trail';

export default function AuditPage() {
  const [filters, setFilters] = useState({
    entityType: '',
    entityId: '',
    userId: '',
    action: '',
    fromDate: '',
    toDate: '',
  });

  const [page, setPage] = useState(1);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.fromDate) params.append('fromDate', Math.floor(new Date(filters.fromDate).getTime() / 1000));
    if (filters.toDate) params.append('toDate', Math.floor(new Date(filters.toDate).getTime() / 1000));

    const response = await fetch(`/api/audit?${params.toString()}&pageSize=10000`);
    const data = await response.json();
    const csv = generateCSV(data.data);
    downloadCSV(csv, 'audit-report.csv');
  };

  const handleLoadStats = async () => {
    if (!filters.fromDate || !filters.toDate) {
      alert('Please select both start and end dates for statistics');
      return;
    }

    const fromDate = Math.floor(new Date(filters.fromDate).getTime() / 1000);
    const toDate = Math.floor(new Date(filters.toDate).getTime() / 1000);

    const response = await fetch(
      `/api/audit?stats=true&fromDate=${fromDate}&toDate=${toDate}`
    );
    const data = await response.json();
    setStats(data.data);
    setShowStats(true);
  };

  const convertToUnixTimestamp = (dateString) => {
    if (!dateString) return null;
    return Math.floor(new Date(dateString).getTime() / 1000);
  };

  const fromDate = convertToUnixTimestamp(filters.fromDate);
  const toDate = convertToUnixTimestamp(filters.toDate);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Audit Trail</h1>
        <p className="text-gray-600 mb-8">View all system actions and changes</p>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <input
                type="text"
                placeholder="e.g., rfi"
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity ID</label>
              <input
                type="text"
                placeholder="ID"
                value={filters.entityId}
                onChange={(e) => handleFilterChange('entityId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                placeholder="User"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">All</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="archive">Archive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
            >
              Export CSV
            </button>
            <button
              onClick={handleLoadStats}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
            >
              Load Statistics
            </button>
          </div>
        </div>

        {showStats && stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Actions</h3>
                <div className="space-y-1 text-sm">
                  {stats.actionStats?.map((stat) => (
                    <div key={stat.action} className="flex justify-between">
                      <span>{stat.action}</span>
                      <span className="font-medium">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Top Users</h3>
                <div className="space-y-1 text-sm">
                  {stats.userStats?.slice(0, 10).map((stat) => (
                    <div key={stat.user_id} className="flex justify-between">
                      <span>{stat.user_id || 'System'}</span>
                      <span className="font-medium">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Audit Logs</h2>
          <AuditTrail
            entityType={filters.entityType}
            entityId={filters.entityId}
            userId={filters.userId}
            action={filters.action}
            fromDate={fromDate}
            toDate={toDate}
            page={page}
            pageSize={50}
          />
        </div>
      </div>
    </div>
  );
}

function generateCSV(logs) {
  const headers = ['ID', 'Entity Type', 'Entity ID', 'Action', 'User ID', 'Timestamp', 'Changes'];
  const rows = logs.map(log => [
    log.id,
    log.entityType,
    log.entityId,
    log.action,
    log.userId || '',
    new Date(log.createdAt * 1000).toISOString(),
    log.changes.map(c => `${c.field}: ${c.from} → ${c.to}`).join('; ')
  ]);

  const csv = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csv;
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
