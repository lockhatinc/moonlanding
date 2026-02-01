'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = [
  'Financial Statements',
  'Cash & Banking',
  'Receivables',
  'Inventory',
  'Fixed Assets',
  'Liabilities',
  'Equity',
  'Revenue',
  'Expenses',
  'Contingencies',
  'Related Parties',
  'Accounting Policies',
  'Other'
];

export function RfiDetail({ rfiId, engagementId, onSave, onQuestionAdded }) {
  const [rfi, setRfi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('draft');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    category: '',
    assigned_to: '',
    due_date: ''
  });

  useEffect(() => {
    if (rfiId) {
      loadRfi();
    }
    loadTemplates();
  }, [rfiId]);

  const loadRfi = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rfi/${rfiId}`);
      const data = await res.json();
      if (data.data) {
        setRfi(data.data);
        setStatus(data.data.status);
      }
    } catch (err) {
      console.error('Failed to load RFI:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/rfi/_templates');
      const data = await res.json();
      setTemplates(data.data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleApplyTemplate = async (templateId) => {
    if (!rfiId) return;
    
    try {
      const res = await fetch(`/api/rfi/_templates?id=${templateId}`);
      const data = await res.json();
      const template = data.data;
      
      if (template && template.questions) {
        for (const q of template.questions) {
          await fetch(`/api/rfi/${rfiId}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(q)
          });
        }
        setSelectedTemplate(null);
        await loadRfi();
        if (onQuestionAdded) onQuestionAdded();
      }
    } catch (err) {
      console.error('Failed to apply template:', err);
    }
  };

  const handleAddQuestion = async () => {
    if (!rfiId || !newQuestion.question) return;

    try {
      const res = await fetch(`/api/rfi/${rfiId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      });

      if (res.ok) {
        setNewQuestion({ question: '', category: '', assigned_to: '', due_date: '' });
        setShowAddQuestion(false);
        await loadRfi();
        if (onQuestionAdded) onQuestionAdded();
      }
    } catch (err) {
      console.error('Failed to add question:', err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!rfiId) return;
    
    try {
      const res = await fetch(`/api/rfi/${rfiId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setStatus(newStatus);
        await loadRfi();
        if (onSave) onSave();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!rfiId || !confirm('Delete this question?')) return;

    try {
      await fetch(`/api/rfi/${rfiId}/questions/${questionId}`, {
        method: 'DELETE'
      });
      await loadRfi();
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  if (!rfiId) {
    return (
      <div className="space-y-4">
        <p className="text-gray-500">Create an RFI first</p>
      </div>
    );
  }

  if (loading) {
    return <div className="h-40 bg-gray-200 rounded animate-pulse" />;
  }

  if (!rfi) {
    return <div className="text-red-500">Failed to load RFI</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">RFI for {engagementId || rfi.engagement_id}</h2>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowAddQuestion(!showAddQuestion)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          {showAddQuestion ? 'Cancel' : 'Add Question'}
        </button>
        
        {selectedTemplate === null && (
          <select
            onChange={(e) => setSelectedTemplate(e.target.value)}
            value={selectedTemplate || ''}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Apply Template...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.questionCount} questions)
              </option>
            ))}
          </select>
        )}

        {selectedTemplate && (
          <div className="flex gap-2">
            <button
              onClick={() => handleApplyTemplate(selectedTemplate)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Apply Template
            </button>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {showAddQuestion && (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          <textarea
            value={newQuestion.question}
            onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
            placeholder="Question text..."
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows="3"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newQuestion.category}
              onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Category...</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="date"
              value={newQuestion.due_date}
              onChange={(e) => setNewQuestion({...newQuestion, due_date: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <button
            onClick={handleAddQuestion}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Add Question
          </button>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Questions ({rfi.questions?.length || 0})</h3>
        {rfi.questions && rfi.questions.length > 0 ? (
          <div className="space-y-2">
            {rfi.questions.map(q => (
              <div key={q.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{q.question}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      {q.category && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {q.category}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded ${
                        q.status === 'answered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {q.status === 'answered' ? 'Answered' : 'Pending'}
                      </span>
                      {q.due_date && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800">
                          Due: {new Date(q.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {q.responses && q.responses.length > 0 && (
                      <div className="mt-3 text-sm">
                        <p className="font-medium text-gray-700">Response:</p>
                        <p className="text-gray-600 mt-1">{q.responses[0].response}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex-shrink-0"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No questions yet. Add one to get started.</p>
        )}
      </div>
    </div>
  );
}
