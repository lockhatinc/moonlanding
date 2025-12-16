'use client';

import { Avatar, Badge, Code, Text } from '@mantine/core';
import { formatFieldValue } from '@/lib/field-registry';

export function FieldRender({ spec, field, value, row }) {
  const formatted = formatFieldValue(value, field, spec, row);

  if (formatted === null) return <Text c="dimmed">-</Text>;

  if (typeof formatted === 'object') {
    if (formatted.color) {
      return <Badge color={formatted.color} variant="light">{formatted.label}</Badge>;
    }
    if (formatted.type === 'avatars') {
      return <AvatarGroup users={formatted.users} />;
    }
  }

  if (field.type === 'image' && value) {
    return <Avatar src={value} size="sm" radius="xl">{row?.name?.[0] || '?'}</Avatar>;
  }
  if (field.type === 'json') {
    return <Code>{formatted}</Code>;
  }

  return <>{formatted}</>;
}

function AvatarGroup({ users, max = 3 }) {
  if (!users?.length) return <Text c="dimmed">-</Text>;
  const visible = users.slice(0, max);
  const rest = users.length - max;

  return (
    <Avatar.Group>
      {visible.map((u, i) => <Avatar key={i} src={u.avatar} size="sm" radius="xl">{u.name?.[0] || '?'}</Avatar>)}
      {rest > 0 && <Avatar size="sm" radius="xl">+{rest}</Avatar>}
    </Avatar.Group>
  );
}

export { AvatarGroup };
