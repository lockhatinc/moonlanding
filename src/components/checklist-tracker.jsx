'use client';

import { useState, useEffect } from 'react';
import { Checkbox, Button, Progress, Stack, Group, Text, Input, Alert, ActionIcon, LoadingOverlay, Skeleton, Modal } from '@mantine/core';
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
    return <Skeleton height={300} />;
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
    <Stack gap="md" className="checklist-tracker">
      <div>
        <Group justify="space-between" mb="xs">
          <Text fw={500}>Progress</Text>
          <Text size="sm">{progress}%</Text>
        </Group>
        <Progress value={progress} color={progress === 100 ? 'green' : 'blue'} />
      </div>

      {success && (
        <Alert color="green" title="Success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert color="red" title="Error" onClose={() => setError(null)}>
          {error}
          <Button size="xs" onClick={refetch} mt="xs">Retry</Button>
        </Alert>
      )}

      <div>
        {items.length === 0 ? (
          <Stack align="center" py="xl">
            <ACTION_ICONS.checklist size={48} style={{ opacity: 0.5, color: 'var(--mantine-color-gray-5)' }} />
            <Text c="dimmed">No checklist items yet</Text>
            <Text size="xs" c="dimmed">Add your first item below to get started</Text>
          </Stack>
        ) : (
          <Stack gap="xs">
            {items.map((item) => (
              editingId === item.id ? (
                <Group key={item.id} gap="sm">
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.currentTarget.value)}
                    placeholder="Edit item..."
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <Button size="xs" onClick={() => handleEditSave(item.id)}>Save</Button>
                  <Button size="xs" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </Group>
              ) : (
                <Group key={item.id} gap="sm" justify="space-between">
                  <Group gap="sm" style={{ flex: 1 }}>
                    <Checkbox
                      checked={item.is_done}
                      onChange={() => handleToggleItem(item.id)}
                    />
                    <Text
                      style={{
                        textDecoration: item.is_done ? 'line-through' : 'none',
                        color: item.is_done ? 'var(--mantine-color-gray-5)' : 'inherit',
                        flex: 1
                      }}
                    >
                      {item.text}
                    </Text>
                  </Group>
                  <ActionIcon onClick={() => handleEditStart(item)} variant="subtle" aria-label="Edit item">
                    <ACTION_ICONS.edit size={16} />
                  </ActionIcon>
                  <ActionIcon color="red" variant="subtle" onClick={() => setDeleteConfirm(item)} aria-label="Delete item">
                    <ACTION_ICONS.delete size={16} />
                  </ActionIcon>
                </Group>
              )
            ))}
          </Stack>
        )}
      </div>

      <Group>
        <Input
          placeholder="Add new item..."
          value={newItem}
          onChange={(e) => setNewItem(e.currentTarget.value)}
          style={{ flex: 1 }}
          disabled={submitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddItem();
          }}
        />
        <Button onClick={handleAddItem} size="sm" loading={submitting} disabled={!newItem.trim()}>
          Add
        </Button>
      </Group>

      <Modal opened={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Item">
        <Text mb="md">Delete "{deleteConfirm?.text}"? This cannot be undone.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="red" onClick={() => deleteConfirm && handleDeleteItem(deleteConfirm.id)}>Delete</Button>
        </Group>
      </Modal>
    </Stack>
  );
}
