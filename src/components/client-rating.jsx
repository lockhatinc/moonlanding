'use client';

import { useState, useEffect } from 'react';
import { Group, Rating, Button, Text, Stack, Alert } from '@mantine/core';
import { ACTION_ICONS } from '@/config/icon-config';

export default function ClientRating({ engagement, user }) {
  if (!user || user.role !== 'client_admin') {
    return null;
  }

  if (!engagement || engagement.stage !== 'finalization') {
    return null;
  }

  const [rating, setRating] = useState(engagement.client_rating || 0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setRating(engagement.client_rating || 0);
  }, [engagement.client_rating]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating before submitting');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/engagement/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          engagement_id: engagement.id,
          rating,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to submit rating');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('[CLIENT_RATING] Submit error:', err);
      setError(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Text size="sm" fw={500}>Client Satisfaction Rating</Text>

      <Group gap="lg" align="center">
        <Rating
          value={rating}
          onChange={setRating}
          size="lg"
          fractions={2}
          readOnly={loading}
        />
        <Text size="sm" c="dimmed">
          {rating > 0 ? `${rating.toFixed(1)} / 5 stars` : 'No rating yet'}
        </Text>
      </Group>

      <Group gap="sm">
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || loading}
          loading={loading}
          size="sm"
        >
          Submit Rating
        </Button>
      </Group>

      {success && (
        <Alert
          icon={<ACTION_ICONS.check size={16} />}
          title="Success"
          color="green"
          variant="light"
        >
          Rating submitted successfully
        </Alert>
      )}

      {error && (
        <Alert
          icon={<ACTION_ICONS.alert size={16} />}
          title="Error"
          color="red"
          variant="light"
        >
          {error}
        </Alert>
      )}
    </Stack>
  );
}
