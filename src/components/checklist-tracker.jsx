'use client';

import { useState, useEffect } from 'react';
import { Checkbox, Button, Progress, Stack, Group, Text, Input } from '@mantine/core';

export function ChecklistTracker({ checklistId, reviewId, onUpdate }) {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklist();
  }, [checklistId]);

  const fetchChecklist = async () => {
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/checklists/${checklistId}`);
      const data = await res.json();

      if (data.success) {
        setItems(data.checklist.items || []);
        setProgress(data.progress || 0);
      }
    } catch (err) {
      console.error('Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (itemId) => {
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/checklists/${checklistId}/items/${itemId}/toggle`, {
        method: 'PATCH'
      });

      if (res.ok) {
        fetchChecklist();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error('Failed to update item');
    }
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) return;

    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/checklists/${checklistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newItem })
      });

      if (res.ok) {
        setNewItem('');
        fetchChecklist();
      }
    } catch (err) {
      console.error('Failed to add item');
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

      <div>
        <Stack gap="xs">
          {items.map((item) => (
            <Group key={item.id} gap="sm">
              <Checkbox
                checked={item.is_done}
                onChange={() => handleToggleItem(item.id)}
              />
              <Text
                style={{
                  textDecoration: item.is_done ? 'line-through' : 'none',
                  flex: 1
                }}
              >
                {item.text}
              </Text>
            </Group>
          ))}
        </Stack>
      </div>

      <Group>
        <Input
          placeholder="Add new item..."
          value={newItem}
          onChange={(e) => setNewItem(e.currentTarget.value)}
          style={{ flex: 1 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddItem();
          }}
        />
        <Button onClick={handleAddItem} size="sm">
          Add
        </Button>
      </Group>
    </Stack>
  );
}
