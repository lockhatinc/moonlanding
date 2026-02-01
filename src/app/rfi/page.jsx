'use client';

import React, { useState } from 'react';
import { RfiList } from '@/components/rfi-list';
import { useRouter } from 'next/navigation';

export default function RfiPage() {
  const router = useRouter();
  const [selectedRfiId, setSelectedRfiId] = useState(null);
  const [engagementId, setEngagementId] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [engagementInput, setEngagementInput] = useState('');

  const handleCreateRfi = async () => {
    if (!engagementInput.trim()) return;

    try {
      const res = await fetch('/api/rfi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagement_id: engagementInput,
          status: 'draft'
        })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/rfi/${data.data.id}`);
      }
    } catch (err) {
      console.error('Failed to create RFI:', err);
    }
  };

  const handleSelectRfi = (rfiId) => {
    setSelectedRfiId(rfiId);
    router.push(`/rfi/${rfiId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">RFI Management</h1>
          <p className="text-gray-600">Create and track Request for Information across your engagements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">RFIs</h2>
              <RfiList engagementId={engagementId} onSelect={handleSelectRfi} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">Create New RFI</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={engagementInput}
                  onChange={(e) => setEngagementInput(e.target.value)}
                  placeholder="Engagement ID or name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleCreateRfi}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                >
                  Create RFI
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">Filter by Engagement</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={engagementId}
                  onChange={(e) => setEngagementId(e.target.value)}
                  placeholder="Enter engagement ID..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => setEngagementId('')}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                >
                  Clear Filter
                </button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">RFI Quick Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Create RFIs for each engagement</li>
                <li>• Use templates to speed up creation</li>
                <li>• Assign questions to team members</li>
                <li>• Track responses and due dates</li>
                <li>• Mark as complete when done</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
