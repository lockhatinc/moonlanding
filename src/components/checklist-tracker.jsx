'use client';

import { useState, useEffect } from 'react';
import { useChecklist } from '@/lib/hooks/use-checklist';
import { showSuccess, showError } from '@/lib/notifications';
import { ACTION_ICONS } from '@/config/icon-config';

export function ChecklistTracker({ checklistId, reviewId, onUpdate }) {
  const { items, progress, loading, error, addItem, toggleItem, deleteItem, refetch, setError } = useChecklist(checklistId, reviewId);
  const [newItem, setNewItem] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading && !items.length) {
    return <div className="h-80 bg-gray-200 rounded-md animate-pulse" />;
  }

  const handleToggleItem = async (itemId) => {
    try {
      await toggleItem(itemId);
      setSuccess('Item toggled');
      if (onUpdate) onUpdate();
    } catch (err) {
      showError(err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteItem(itemId);
      setSuccess('Item deleted');
      setDeleteConfirm(null);
      if (onUpdate) onUpdate();
    } catch (err) {
      showError(err);
    }
  };

  const handleEditStart = (item) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const handleEditSave = async (itemId) => {
    if (!editText.trim()) return;
    try {
      await addItem(editText);
      setSuccess('Item updated');
      setEditingId(null);
      setEditText('');
      if (onUpdate) onUpdate();
    } catch (err) {
      showError(err);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) return;

    setSubmitting(true);
    try {
      await addItem(newItem);
      setSuccess('Item added');
      setNewItem('');
      if (onUpdate) onUpdate();
    } catch (err) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 checklist-tracker">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">Progress</span>
          <span className="text-sm">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {success && (
        <div className="alert alert-success flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-lg">&times;</button>
        </div>
      )}

      {error && (
        <div className="alert alert-error flex flex-col gap-2">
          <span>{error}</span>
          <button onClick={refetch} className="btn btn-sm btn-outline mt-2">Retry</button>
        </div>
      )}

      <div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <ACTION_ICONS.checklist size={48} style={{ opacity: 0.5, color: '#999' }} />
            <p className="text-gray-500">No checklist items yet</p>
            <p className="text-xs text-gray-500">Add your first item below to get started</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              editingId === item.id ? (
                <div key={item.id} className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    value={editText}
                    onChange={(e) => setEditText(e.currentTarget.value)}
                    placeholder="Edit item..."
                    autoFocus
                  />
                  <button onClick={() => handleEditSave(item.id)} className="btn btn-sm">Save</button>
                  <button onClick={() => setEditingId(null)} className="btn btn-sm btn-outline">Cancel</button>
                </div>
              ) : (
                <div key={item.id} className="flex gap-2 justify-between items-center p-2 border rounded">
                  <div className="flex gap-2 flex-1">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={item.is_done}
                      onChange={() => handleToggleItem(item.id)}
                    />
                    <span
                      className={`flex-1 ${item.is_done ? 'line-through text-gray-400' : ''}`}
                    >
                      {item.text}
                    </span>
                  </div>
                  <button onClick={() => handleEditStart(item)} className="btn btn-sm btn-ghost" aria-label="Edit item">
                    <ACTION_ICONS.edit size={16} />
                  </button>
                  <button className="btn btn-sm btn-ghost text-red-500" onClick={() => setDeleteConfirm(item)} aria-label="Delete item">
                    <ACTION_ICONS.delete size={16} />
                  </button>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="input flex-1"
          placeholder="Add new item..."
          value={newItem}
          onChange={(e) => setNewItem(e.currentTarget.value)}
          disabled={submitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddItem();
          }}
        />
        <button
          onClick={handleAddItem}
          className="btn btn-sm"
          disabled={!newItem.trim() || submitting}
        >
          {submitting ? 'Adding...' : 'Add'}
        </button>
      </div>

      {deleteConfirm && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Item</h3>
            <p className="py-4">Delete "{deleteConfirm?.text}"? This cannot be undone.</p>
            <div className="modal-action">
              <button onClick={() => setDeleteConfirm(null)} className="btn">Cancel</button>
              <button onClick={() => deleteConfirm && handleDeleteItem(deleteConfirm.id)} className="btn btn-error">Delete</button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
