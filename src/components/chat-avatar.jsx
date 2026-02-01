'use client';

import { memo } from 'react';
import { Avatar, Tooltip, Badge, Group } from '@mantine/core';

export const ChatAvatar = memo(({ user, isOnline = false, size = 'md' }) => {
  if (!user) {
    return <Avatar size={size} color="gray">?</Avatar>;
  }

  const initial = user.name ? user.name[0].toUpperCase() : '?';
  const color = ['blue', 'cyan', 'green', 'lime', 'orange', 'pink', 'purple', 'red', 'teal', 'violet'][
    user.id?.charCodeAt(0) % 10
  ] || 'blue';

  const content = (
    <Avatar
      size={size}
      radius="xl"
      color={color}
      style={{ position: 'relative' }}
    >
      {initial}
    </Avatar>
  );

  if (isOnline) {
    return (
      <Tooltip label={`${user.name} - Online`} withArrow>
        <Group gap={0} style={{ position: 'relative' }}>
          {content}
          <Badge
            size="xs"
            color="green"
            circle
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              padding: '3px'
            }}
          />
        </Group>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={user.name} withArrow>
      {content}
    </Tooltip>
  );
});
