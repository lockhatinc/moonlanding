'use client';

import { Box, Stack, Text, Button, Center } from '@mantine/core';
import { Link } from '@/lib/next-polyfills';
import { ACTION_ICONS } from '@/config/icon-config';

export function EmptyState({
  title = 'No items found',
  message = 'Get started by creating your first item',
  icon: Icon = ACTION_ICONS.inbox,
  action = null,
  actionLabel = 'Create',
  actionHref = null,
}) {
  return (
    <Center py="xl" mih={400}>
      <Stack gap="md" align="center" ta="center">
        <Box c="dimmed" style={{ opacity: 0.5 }}>
          <Icon size={64} strokeWidth={1} />
        </Box>
        <Stack gap="xs">
          <Text fw={600} size="lg">{title}</Text>
          <Text c="dimmed" size="sm">{message}</Text>
        </Stack>
        {action && actionHref && (
          <Button
            component={Link}
            href={actionHref}
            mt="md"
            leftSection={<ACTION_ICONS.plus size={16} />}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Center>
  );
}

export function NoSearchResults({ query }) {
  return (
    <EmptyState
      icon={ACTION_ICONS.search}
      title="No results found"
      message={`No items match your search for "${query}". Try different keywords.`}
    />
  );
}

export function NoDataState({ entityName, onCreateClick }) {
  return (
    <EmptyState
      title={`No ${entityName} yet`}
      message={`Create your first ${entityName.toLowerCase()} to get started`}
      icon={ACTION_ICONS.file}
      action={onCreateClick ? true : false}
      actionLabel={`New ${entityName}`}
      actionHref={onCreateClick ? '#' : null}
    />
  );
}
