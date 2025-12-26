'use client';

import { useState, useEffect } from 'react';
import { Button, Stack, Textarea, Group, Badge, ActionIcon, Alert, Modal, Text, Tooltip } from '@mantine/core';
import { HIGHLIGHT_PALETTE } from '@/config/constants';
import { ACTION_ICONS } from '@/config/icon-config';
import { useHighlights } from '@/lib/hooks/use-highlights';
import { showSuccess, showError } from '@/lib/notifications';

const MAX_COMMENT_LENGTH = 1000;

export function HighlightAnnotator({ reviewId, highlightId, onSave, onDelete, onCancel, isEditing = false }) {
  const { saveHighlight, deleteHighlight, setError: setHookError } = useHighlights(reviewId);
  const [comment, setComment] = useState('');
  const [selectedColor, setSelectedColor] = useState('#B0B0B0');
  const [resolved, setResolved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges && comment.trim()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges, comment]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await saveHighlight({
        id: isEditing ? highlightId : undefined,
        comment,
        color: selectedColor,
        status: resolved ? 'resolved' : 'unresolved'
      });
      showSuccess('Highlight saved');
      setUnsavedChanges(false);
      if (onSave) onSave();
    } catch (err) {
      setError(err?.message || 'Failed to save highlight');
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    setError('');
    try {
      await deleteHighlight(highlightId);
      showSuccess('Highlight deleted');
      if (onDelete) onDelete();
    } catch (err) {
      setError(err?.message || 'Failed to delete highlight');
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md" className="highlight-annotator">
      {error && (
        <Alert color="red" title="Error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div>
        <Text fw={500} size="sm" mb="xs">Color</Text>
        <Group gap="xs">
          {Object.entries(HIGHLIGHT_PALETTE).map(([key, palette]) => (
            <Tooltip key={key} label={palette.label}>
              <Button
                size="xs"
                variant={selectedColor === palette.color ? 'filled' : 'outline'}
                color={key}
                onClick={() => {
                  setSelectedColor(palette.color);
                  setUnsavedChanges(true);
                }}
                disabled={loading}
                style={{
                  backgroundColor: selectedColor === palette.color ? palette.color : undefined,
                  borderColor: palette.color
                }}
              >
                <Badge color={key} size="sm">{palette.label}</Badge>
              </Button>
            </Tooltip>
          ))}
        </Group>
      </div>

      <div>
        <Textarea
          label="Comment"
          placeholder="Add your comment..."
          value={comment}
          onChange={(e) => {
            setComment(e.currentTarget.value);
            setUnsavedChanges(true);
          }}
          minRows={3}
          maxLength={MAX_COMMENT_LENGTH}
          disabled={loading}
          description={`${comment.length}/${MAX_COMMENT_LENGTH} characters`}
        />
      </div>

      <Group justify="space-between">
        <Button
          variant={resolved ? 'filled' : 'outline'}
          onClick={() => {
            setResolved(!resolved);
            setUnsavedChanges(true);
          }}
          color={resolved ? 'green' : 'gray'}
          disabled={loading}
          leftSection={resolved ? <ACTION_ICONS.check size={14} /> : null}
        >
          {resolved ? 'Resolved' : 'Mark as Resolved'}
        </Button>

        <Group gap="xs">
          {isEditing && (
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={loading || !comment.trim()}
            loading={loading}
          >
            Save
          </Button>
          {isEditing && (
            <ActionIcon
              color="red"
              variant="light"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
            >
              <ACTION_ICONS.delete size={16} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      <Modal
        opened={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Highlight"
      >
        <Text mb="md">Delete this highlight and all its comments? This action cannot be undone.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
