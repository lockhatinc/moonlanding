'use client';

import { useState } from 'react';
import { Stack, Button, Badge, Group, Text, ActionIcon, Tooltip, Modal, Alert, Skeleton } from '@mantine/core';
import { UI_ICONS, ACTION_ICONS } from '@/config/icon-config';
import { usePriorityReviews } from '@/lib/hooks/use-priority-reviews';
import { showSuccess, showError } from '@/lib/notifications';
import { notifications } from '@mantine/notifications';

export function PriorityReviewsSidebar({ userId, reviewId, onSelectReview }) {
  const { reviews, loading, error, removePriority, refetch, setError } = usePriorityReviews(userId);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeTargetId, setRemoveTargetId] = useState(null);

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
    notifications.show({
      message: `Viewing review`,
      color: 'blue',
      autoClose: 1000
    });
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
        <Button size="xs" leftSection={<UI_ICONS.star size={14} />} onClick={() => {}} title="Add priority review">
          +
        </Button>
      </Group>

      {reviews.length === 0 ? (
        <Text size="xs" c="dimmed" ta="center" py="md">No priority reviews yet</Text>
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
              <UI_ICONS.gripVertical size={16} style={{ cursor: 'grab' }} />
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
