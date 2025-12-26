'use client';

import { useState } from 'react';
import { Checkbox, Button, Progress, Stack, Group, Text, Input, Alert, ActionIcon, LoadingOverlay, Skeleton } from '@mantine/core';
import { useChecklist } from '@/lib/hooks/use-checklist';
import { showSuccess, showError } from '@/lib/notifications';
import { ACTION_ICONS } from '@/config/icon-config';

export function ChecklistTracker({ checklistId, reviewId, onUpdate }) {
  const { items, progress, loading, error, addItem, toggleItem, deleteItem, refetch, setError } = useChecklist(checklistId, reviewId);
  const [newItem, setNewItem] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading && !items.length) {
    return <Skeleton height={300} />;
  }

  const handleToggleItem = async (itemId) => {
    try {
      await toggleItem(itemId);
      showSuccess('Item toggled');
      if (onUpdate) onUpdate();
    } catch (err) {
      showError(err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteItem(itemId);
      showSuccess('Item deleted');
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
      showSuccess('Item added');
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

      {error && (
        <Alert color="red" title="Error" onClose={() => setError(null)}>
          {error}
          <Button size="xs" onClick={refetch} mt="xs">Retry</Button>
        </Alert>
      )}

      <div>
        {items.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">No checklist items yet. Add your first item below.</Text>
        ) : (
          <Stack gap="xs">
            {items.map((item) => (
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
                <ActionIcon color="red" variant="subtle" onClick={() => handleDeleteItem(item.id)}>
                  <ACTION_ICONS.delete size={16} />
                </ActionIcon>
              </Group>
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
    </Stack>
  );
}
