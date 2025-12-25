'use client';

import { useState, useEffect } from 'react';
import { Alert, Badge, Group, Stack, Text, Progress } from '@mantine/core';

const STATUS_COLORS = {
  open: 'blue',
  warning: 'yellow',
  urgent: 'orange',
  critical: 'red',
  closed: 'gray'
};

export function TenderTracker({ tenderId, reviewId }) {
  const [tender, setTender] = useState(null);
  const [status, setStatus] = useState('');
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTender();
    const interval = setInterval(fetchTender, 60000);
    return () => clearInterval(interval);
  }, [tenderId]);

  const fetchTender = async () => {
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/tender/${tenderId}`);
      const data = await res.json();

      if (data.success) {
        setTender(data.tender);
        setStatus(data.status);
        setDaysRemaining(data.days_remaining);
      }
    } catch (err) {
      console.error('Failed to load tender');
    } finally {
      setLoading(false);
    }
  };

  if (!tender) return null;

  const alertType = status === 'critical' ? 'error' : status === 'urgent' ? 'warning' : 'info';
  const progressColor = STATUS_COLORS[status] || 'blue';

  return (
    <Stack gap="md" className="tender-tracker">
      <Group justify="space-between">
        <Text fw={500}>{tender.name}</Text>
        <Badge color={STATUS_COLORS[status]}>{status.toUpperCase()}</Badge>
      </Group>

      {status === 'critical' && (
        <Alert color="red" title="CRITICAL">
          Deadline is TODAY! Take action immediately.
        </Alert>
      )}

      {status === 'urgent' && (
        <Alert color="orange" title="URGENT">
          Less than 24 hours remaining
        </Alert>
      )}

      <div>
        <Group justify="space-between" mb="xs">
          <Text size="sm">Days Remaining</Text>
          <Text size="sm" fw={500}>{Math.max(daysRemaining, 0)}</Text>
        </Group>
        <Progress
          value={Math.max(0, Math.min(100, (daysRemaining / 7) * 100))}
          color={progressColor}
        />
      </div>

      {tender.deadline && (
        <Text size="xs" c="dimmed">
          Due: {new Date(tender.deadline * 1000).toLocaleDateString()}
        </Text>
      )}
    </Stack>
  );
}
