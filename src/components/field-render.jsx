'use client';

import { Avatar, Badge, Code, Group, Text } from '@mantine/core';

const colorMap = {
  green: 'green',
  yellow: 'yellow',
  amber: 'orange',
  blue: 'blue',
  gray: 'gray',
  red: 'red',
};

export function FieldRender({ spec, field, value, row }) {
  if (value === null || value === undefined || value === '') {
    return <Text c="dimmed">—</Text>;
  }

  switch (field.type) {
    case 'enum':
      const opt = spec.options?.[field.options]?.find(o => String(o.value) === String(value));
      if (!opt) return String(value);
      return (
        <Badge color={colorMap[opt.color] || 'gray'} variant="light">
          {opt.label}
        </Badge>
      );

    case 'ref':
      if (field.display === 'avatars' && Array.isArray(value)) {
        return <AvatarGroup users={value} />;
      }
      return row[`${field.key}_display`] || value;

    case 'date':
    case 'timestamp':
      if (!value) return '—';
      const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
      return date.toLocaleDateString();

    case 'bool':
      return value ? 'Yes' : 'No';

    case 'image':
      return (
        <Avatar src={value} size="sm" radius="xl">
          {row?.name?.[0] || '?'}
        </Avatar>
      );

    case 'json':
      const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
      return <Code>{jsonStr.substring(0, 50)}...</Code>;

    case 'decimal':
      return typeof value === 'number' ? value.toFixed(2) : value;

    case 'textarea':
      const text = String(value);
      return text.length > 100 ? text.substring(0, 100) + '...' : text;

    default:
      return String(value);
  }
}

function AvatarGroup({ users, max = 3 }) {
  if (!users || users.length === 0) {
    return <Text c="dimmed">—</Text>;
  }

  const visible = users.slice(0, max);
  const rest = users.length - max;

  return (
    <Avatar.Group>
      {visible.map((u, i) => (
        <Avatar key={i} src={u.avatar} size="sm" radius="xl">
          {u.name?.[0] || '?'}
        </Avatar>
      ))}
      {rest > 0 && (
        <Avatar size="sm" radius="xl">+{rest}</Avatar>
      )}
    </Avatar.Group>
  );
}

export { AvatarGroup };
