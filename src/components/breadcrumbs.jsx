'use client';

import { Breadcrumbs, Group, Text } from '@mantine/core';
import { Link } from '@/lib/next-polyfills';
import { ACTION_ICONS } from '@/config/icon-config';

export function BreadcrumbNav({ items = [] }) {
  if (!items || items.length === 0) return null;

  const breadcrumbs = items.map((item, index) => {
    const isLast = index === items.length - 1;
    const Icon = item.icon ? require('@/config/icon-config')[item.icon] : null;

    if (isLast) {
      return (
        <Group key={item.label} gap="xs">
          {Icon && <Icon size={16} />}
          <Text size="sm" fw={500}>{item.label}</Text>
        </Group>
      );
    }

    return (
      <Link key={item.href} href={item.href}>
        <Group gap="xs" style={{ cursor: 'pointer' }}>
          {Icon && <Icon size={16} />}
          <Text size="sm" style={{ color: 'var(--mantine-color-blue-6)' }}>
            {item.label}
          </Text>
        </Group>
      </Link>
    );
  });

  return (
    <Breadcrumbs separator={<ACTION_ICONS.chevronRight size={14} />} mb="md">
      {breadcrumbs}
    </Breadcrumbs>
  );
}
