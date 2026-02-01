'use client';

import { useState, useEffect } from 'react';

export function RfiResponsePanel({ rfiId, questionId, onResponseSubmitted }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    response: '',
    attachments: []
  });

  useEffect(() => {
    if (questionId) {
      loadResponses();
    }
  }, [questionId]);

  const loadResponses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rfi/${rfiId}/questions/${questionId}/responses`);
      const data = await res.json();
      setResponses(data.data || []);
    } catch (err) {
      console.error('Failed to load responses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!formData.response.trim()) return;

    try {
      const res = await fetch(`/api/rfi/${rfiId}/questions/${questionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setFormData({ response: '', attachments: [] });
        setShowForm(false);
        await loadResponses();
        if (onResponseSubmitted) onResponseSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit response:', err);
    }
  };

  if (!questionId) {
    return <p className="text-gray-500">Select a question to view responses</p>;
  }

  if (loading) {
    return <div className="h-32 bg-gray-200 rounded animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Responses</h3>

      {responses.length === 0 ? (
        <p className="text-gray-500">No responses yet</p>
      ) : (
        <div className="space-y-3">
          {responses.map(r => (
            <div key={r.id} className="border rounded-lg p-4 bg-white">
              <p className="text-sm text-gray-500">
                {new Date(r.created_at * 1000).toLocaleString()}
              </p>
              <p className="text-gray-900 mt-2">{r.response}</p>
              {r.attachments && JSON.parse(r.attachments || '[]').length > 0 && (
                <div className="mt-2 text-sm">
                  <p className="font-medium text-gray-700">Attachments:</p>
                  <ul className="list-disc list-inside text-blue-600">
                    {JSON.parse(r.attachments).map((a, i) => (
                      <li key={i}>{a.name || a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-4 mt-4">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Add Response
          </button>
        ) : (
          <div className="space-y-3">
            <textarea
              value={formData.response}
              onChange={(e) => setFormData({...formData, response: e.target.value})}
              placeholder="Enter your response..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows="4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmitResponse}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Submit Response
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
