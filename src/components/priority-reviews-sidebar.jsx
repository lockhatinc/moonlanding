'use client';

import { useState, useEffect } from 'react';
import { Stack, Button, Badge, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { GripVertical, X } from 'tabler-icons-react';

export function PriorityReviewsSidebar({ userId, onSelectReview }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPriorityReviews();
  }, [userId]);

  const fetchPriorityReviews = async () => {
    try {
      const res = await fetch(`/api/mwr/user/${userId}/priority-reviews`);
      const data = await res.json();

      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load priority reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePriority = async (reviewId) => {
    try {
      await fetch(`/api/mwr/user/${userId}/priority-reviews/${reviewId}`, {
        method: 'DELETE'
      });
      fetchPriorityReviews();
    } catch (err) {
      console.error('Failed to remove priority');
    }
  };

  return (
    <Stack gap="md" className="priority-reviews-sidebar">
      <div>
        <Text fw={500} size="sm">PRIORITY REVIEWS</Text>
        {reviews.length === 0 && !loading && (
          <Text size="xs" c="dimmed">No priority reviews yet</Text>
        )}
      </div>

      <Stack gap="xs">
        {reviews.map((review, idx) => (
          <Group
            key={review.id}
            p="xs"
            style={{
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => onSelectReview(review.id)}
          >
            <GripVertical size={16} />
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500}>{review.name}</Text>
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
                  handleRemovePriority(review.id);
                }}
              >
                <X size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ))}
      </Stack>
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
