'use client';

import { useState } from 'react';
import { Stack, Button, Badge, Group, Text, ActionIcon, Tooltip, Modal, Alert, Skeleton, Select } from '@mantine/core';
import { UI_ICONS, ACTION_ICONS } from '@/config/icon-config';
import { usePriorityReviews } from '@/lib/hooks/use-priority-reviews';
import { showSuccess, showError } from '@/lib/notifications';
import { notifications } from '@mantine/notifications';

export function PriorityReviewsSidebar({ userId, reviewId, onSelectReview }) {
  const { reviews, loading, error, addPriority, removePriority, refetch, setError } = usePriorityReviews(userId);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeTargetId, setRemoveTargetId] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [availableReviews, setAvailableReviews] = useState([]);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  if (loading && !reviews.length) {
    return <Skeleton height={300} />;
  }

  const handleRemoveClick = (id) => {
    setRemoveTargetId(id);
    setShowRemoveConfirm(true);
  };

  const confirmRemove = async () => {
    setShowRemoveConfirm(false);
    try {
      await removePriority(removeTargetId);
      showSuccess('Removed from priority reviews');
    } catch (err) {
      showError(err);
    }
  };

  const handleSelectReview = (id) => {
    onSelectReview?.(id);
  };

  const fetchAvailableReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch('/api/mwr/review');
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      const priorityIds = reviews.map(r => r.id);
      const available = data.items.filter(r => !priorityIds.includes(r.id));
      setAvailableReviews(available);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleOpenAddDialog = () => {
    setShowAddDialog(true);
    fetchAvailableReviews();
  };

  const handleAddPriority = async () => {
    if (!selectedReviewId) return;
    try {
      await addPriority(selectedReviewId);
      showSuccess('Added to priority reviews');
      setShowAddDialog(false);
      setSelectedReviewId(null);
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Stack gap="md" className="priority-reviews-sidebar">
      {error && (
        <Alert color="red" title="Error" onClose={() => setError(null)}>
          {error}
          <Button size="xs" onClick={refetch} mt="xs">Retry</Button>
        </Alert>
      )}

      <Group justify="space-between">
        <Text fw={500} size="sm">PRIORITY REVIEWS ({reviews.length})</Text>
        <Button size="xs" leftSection={<UI_ICONS.star size={14} />} onClick={handleOpenAddDialog} title="Add priority review">
          +
        </Button>
      </Group>

      {reviews.length === 0 ? (
        <Stack align="center" py="xl">
          <UI_ICONS.star size={48} style={{ opacity: 0.5, color: 'var(--mantine-color-gray-5)' }} />
          <Text c="dimmed">No priority reviews yet</Text>
          <Text size="xs" c="dimmed">Add reviews to quickly access your most important work</Text>
        </Stack>
      ) : (
        <Stack gap="xs">
          {reviews.map((review) => (
            <Group
              key={review.id}
              p="xs"
              style={{
                backgroundColor: reviewId === review.id ? '#e7f5ff' : '#f5f5f5',
                borderRadius: '4px',
                cursor: 'pointer',
                border: reviewId === review.id ? '1px solid #339af0' : 'none'
              }}
              onClick={() => handleSelectReview(review.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={500} truncate>{review.name}</Text>
                <Badge size="xs" color={getStatusColor(review.status)}>
                  {review.status}
                </Badge>
              </div>
              <Tooltip label="Remove from priority">
                <ActionIcon
                  size="xs"
                  variant="light"
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveClick(review.id);
                  }}
                  aria-label="Remove from priority reviews"
                >
                  <ACTION_ICONS.delete size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          ))}
        </Stack>
      )}

      <Modal
        opened={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        title="Remove from Priority"
      >
        <Text mb="md">Remove this review from priority reviews?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setShowRemoveConfirm(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmRemove}>
            Remove
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title="Add Priority Review"
      >
        <Select
          label="Select Review"
          data={availableReviews.map(r => ({ value: r.id.toString(), label: r.name }))}
          value={selectedReviewId}
          onChange={setSelectedReviewId}
          searchable
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddPriority} disabled={!selectedReviewId}>Add</Button>
        </Group>
      </Modal>
    </Stack>
  );
}

function getStatusColor(status) {
  const colors = {
    active: 'blue',
    pending: 'yellow',
    completed: 'green',
    archived: 'gray'
  };
  return colors[status] || 'gray';
}
