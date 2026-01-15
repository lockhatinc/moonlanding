'use client';

import React from 'react';
import { Paper, Group, Button, Text, Badge, Stack } from '@mantine/core';
import { ACTION_ICONS } from '@/config/icon-config';

/**
 * Toolbar that appears when items are selected
 * Shows selection count and bulk action buttons
 */
export function BulkActionsToolbar({
  selectionCount = 0,
  actions = [],
  onClearSelection,
  loading = false,
}) {
  if (selectionCount === 0) return null;

  return (
    <Paper
      p="md"
      withBorder
      style={{
        backgroundColor: 'var(--mantine-color-blue-0)',
        borderColor: 'var(--mantine-color-blue-3)',
        animation: 'slideDown 200ms ease-out',
      }}
    >
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <Group justify="space-between">
        <Group gap="md">
          <Badge size="lg" variant="light">
            {selectionCount} selected
          </Badge>
          <Text size="sm" c="dimmed">
            {actions.length} action{actions.length !== 1 ? 's' : ''} available
          </Text>
        </Group>

        <Group gap="sm">
          {actions.map(action => (
            <Button
              key={action.id}
              size="sm"
              variant={action.variant || 'light'}
              color={action.color || 'blue'}
              onClick={() => action.onClick?.(action)}
              loading={action.loading || loading}
              disabled={loading || action.disabled}
              leftSection={action.icon}
            >
              {action.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={onClearSelection}
            disabled={loading}
          >
            Clear
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}
