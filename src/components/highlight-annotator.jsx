'use client';

import { useState, useRef } from 'react';
import { Button, Stack, Textarea, Group, ColorPicker, Badge, ActionIcon } from '@mantine/core';
import { HIGHLIGHT_PALETTE } from '@/config/constants';
import { ACTION_ICONS } from '@/config/icon-config';

export function HighlightAnnotator({ reviewId, highlightId, onSave, onDelete, isEditing = false }) {
  const [comment, setComment] = useState('');
  const [selectedColor, setSelectedColor] = useState('#B0B0B0');
  const [status, setStatus] = useState('open');
  const [resolved, setResolved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    try {
      const endpoint = isEditing
        ? `/api/mwr/review/${reviewId}/highlights/${highlightId}`
        : `/api/mwr/review/${reviewId}/highlights`;

      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment,
          color: selectedColor,
          status: resolved ? 'resolved' : status
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (onSave) onSave(data);
      }
    } catch (err) {
      console.error('Failed to save highlight');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this highlight?')) return;

    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/highlights/${highlightId}`, {
        method: 'DELETE'
      });

      if (res.ok && onDelete) onDelete();
    } catch (err) {
      console.error('Failed to delete highlight');
    }
  };

  return (
    <Stack gap="md" className="highlight-annotator">
      <div>
        <Group mb="xs">
          <span className="font-semibold">Color</span>
          <Group gap="xs">
            {Object.entries(HIGHLIGHT_PALETTE).map(([key, palette]) => (
              <Button
                key={key}
                size="xs"
                onClick={() => setSelectedColor(palette.color)}
                style={{
                  backgroundColor: palette.color,
                  border: selectedColor === palette.color ? '2px solid black' : 'none'
                }}
                title={palette.label}
              />
            ))}
          </Group>
        </Group>
      </div>

      <Textarea
        placeholder="Add comment..."
        value={comment}
        onChange={(e) => setComment(e.currentTarget.value)}
        minRows={3}
        disabled={loading}
      />

      <Group>
        <Button.Group>
          <Button
            variant={resolved ? 'filled' : 'light'}
            onClick={() => setResolved(!resolved)}
            color={resolved ? 'green' : 'gray'}
          >
            {resolved ? '✓ Resolved' : 'Mark Resolved'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            loading={loading}
          >
            Save
          </Button>
          {isEditing && (
            <ActionIcon
              color="red"
              variant="light"
              onClick={handleDelete}
              disabled={loading}
            >
              <ACTION_ICONS.delete size={16} />
            </ActionIcon>
          )}
        </Button.Group>
      </Group>
    </Stack>
  );
}
