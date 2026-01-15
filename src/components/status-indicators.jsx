'use client';

import { Box, Group, Stack, Text, RingProgress } from '@mantine/core';
import { ACTION_ICONS } from '@/config/icon-config';

export function LoadingIndicator({
  message = 'Loading...',
  size = 'md',
  compact = false,
}) {
  return (
    <Stack gap="sm" align="center">
      <RingProgress
        sections={[{ value: 100, color: 'blue' }]}
        label={
          <Text fw={700} ta="center">
            <ACTION_ICONS.loader size={compact ? 16 : 24} style={{ animation: 'spin 1s linear infinite' }} />
          </Text>
        }
        size={compact ? 50 : 120}
        thickness={4}
      />
      {!compact && <Text c="dimmed" size="sm">{message}</Text>}
    </Stack>
  );
}

export function StatusBadge({
  status,
  size = 'sm',
  variant = 'filled',
}) {
  const statusConfig = {
    active: { color: 'green', label: 'Active' },
    inactive: { color: 'gray', label: 'Inactive' },
    pending: { color: 'yellow', label: 'Pending' },
    completed: { color: 'blue', label: 'Completed' },
    error: { color: 'red', label: 'Error' },
    warning: { color: 'orange', label: 'Warning' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Box
      component="span"
      px={size === 'sm' ? 8 : 12}
      py={size === 'sm' ? 4 : 6}
      bg={variant === 'filled' ? `${config.color}.1` : 'transparent'}
      style={{
        color: `var(--mantine-color-${config.color}-7)`,
        borderRadius: 4,
        fontSize: size === 'sm' ? 12 : 14,
        fontWeight: 500,
        border: variant === 'outline' ? `1px solid var(--mantine-color-${config.color}-6)` : 'none',
      }}
    >
      {config.label}
    </Box>
  );
}

export function NoData({
  title = 'No data available',
  message = 'There is nothing to display right now.',
  action = null,
}) {
  return (
    <Stack align="center" gap="md" py="xl">
      <Box c="dimmed" style={{ opacity: 0.5 }}>
        <ACTION_ICONS.inbox size={48} strokeWidth={1} />
      </Box>
      <Stack gap="xs" align="center">
        <Text fw={600}>{title}</Text>
        <Text c="dimmed" size="sm" maw={300} ta="center">{message}</Text>
      </Stack>
      {action}
    </Stack>
  );
}
