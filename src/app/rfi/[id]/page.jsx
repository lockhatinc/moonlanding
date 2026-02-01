'use client';

import React, { useState, useEffect } from 'react';
import { RfiDetail } from '@/components/rfi-detail';
import { RfiResponsePanel } from '@/components/rfi-response-panel';
import { useRouter } from 'next/navigation';

export default function RfiDetailPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [rfi, setRfi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [activeTab, setActiveTab] = useState('questions');

  useEffect(() => {
    loadRfi();
  }, [id]);

  const loadRfi = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rfi/${id}`);
      const data = await res.json();
      if (data.data) {
        setRfi(data.data);
        if (data.data.questions && data.data.questions.length > 0) {
          setSelectedQuestion(data.data.questions[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load RFI:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-screen bg-gray-100 animate-pulse" />;
  }

  if (!rfi) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push('/rfi')}
            className="text-blue-500 hover:text-blue-700 mb-4"
          >
            ← Back to RFIs
          </button>
          <div className="text-red-500">Failed to load RFI</div>
        </div>
      </div>
    );
  }

  const questionStats = rfi.questions ? {
    total: rfi.questions.length,
    answered: rfi.questions.filter(q => q.status === 'answered').length,
    pending: rfi.questions.filter(q => q.status === 'pending').length
  } : { total: 0, answered: 0, pending: 0 };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/rfi')}
          className="text-blue-500 hover:text-blue-700 mb-4 flex items-center gap-1"
        >
          ← Back to RFIs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Questions</p>
            <p className="text-3xl font-bold text-gray-900">{questionStats.total}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
            <p className="text-sm text-green-700">Answered</p>
            <p className="text-3xl font-bold text-green-900">{questionStats.answered}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
            <p className="text-sm text-yellow-700">Pending</p>
            <p className="text-3xl font-bold text-yellow-900">{questionStats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">{rfi.status}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <RfiDetail
                rfiId={id}
                engagementId={rfi.engagement_id}
                onSave={loadRfi}
                onQuestionAdded={loadRfi}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4">Questions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {rfi.questions && rfi.questions.length > 0 ? (
                  rfi.questions.map(q => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuestion(q.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        selectedQuestion === q.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {q.question}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          q.status === 'answered'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {q.status === 'answered' ? '✓ Answered' : 'Pending'}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No questions yet</p>
                )}
              </div>
            </div>

            {selectedQuestion && (
              <div className="bg-white rounded-lg shadow p-6">
                <RfiResponsePanel
                  rfiId={id}
                  questionId={selectedQuestion}
                  onResponseSubmitted={loadRfi}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
