'use client';

import { Alert, Badge, Group, Stack, Text, Progress, Paper, ActionIcon, Skeleton, Button } from '@mantine/core';
import { useTender } from '@/lib/hooks/use-tender';
import { showError } from '@/lib/notifications';
import { UI_ICONS } from '@/config/icon-config';

const STATUS_COLORS = {
  open: 'blue',
  warning: 'yellow',
  urgent: 'orange',
  critical: 'red',
  closed: 'gray'
};

export function TenderTracker({ tenderId, reviewId }) {
  const { tender, daysRemaining, loading, error, refetch, setError } = useTender(tenderId, reviewId);

  if (loading && !tender) {
    return <Skeleton height={200} />;
  }

  if (!tender) {
    return (
      <Paper p="md" withBorder>
        <Text c="dimmed" ta="center" py="md">No tender assigned to this review</Text>
      </Paper>
    );
  }

  const status = daysRemaining > 7 ? 'open' : daysRemaining > 1 ? 'warning' : daysRemaining > 0 ? 'urgent' : 'critical';
  const progressColor = STATUS_COLORS[status] || 'blue';

  const calculateProgress = () => {
    if (!tender.deadline || !tender.start_date) return 0;
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const totalDays = Math.ceil((tender.deadline - tender.start_date) / MS_PER_DAY);
    if (totalDays <= 0) return 0;
    const elapsedDays = (Date.now() - tender.start_date) / MS_PER_DAY;
    return Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));
  };

  return (
    <Stack gap="md" className="tender-tracker">
      {error && (
        <Alert color="red" title="Error" onClose={() => setError(null)}>
          {error}
          <Button size="xs" onClick={refetch} mt="xs">Retry</Button>
        </Alert>
      )}

      <Group justify="space-between">
        <Text fw={500}>{tender.name || 'Tender'}</Text>
        <Group gap="xs">
          <Badge color={STATUS_COLORS[status]}>{status.toUpperCase()}</Badge>
          <ActionIcon onClick={refetch} loading={loading} title="Refresh" aria-label="Refresh tender information">
            <UI_ICONS.refresh size={16} />
          </ActionIcon>
        </Group>
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
          value={calculateProgress()}
          color={progressColor}
        />
      </div>

      {tender.deadline && (
        <Text size="xs" c="dimmed">
          Due: {new Date(tender.deadline * 1000).toLocaleDateString()}
        </Text>
      )}

      <Text size="xs" c="dimmed" fs="italic">
        Auto-refreshing every 60 seconds
      </Text>
    </Stack>
  );
}
