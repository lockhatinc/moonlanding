import { memo } from 'react';
import { SimpleGrid, UnstyledButton, Paper, Group, Text, ThemeIcon } from '@mantine/core';
import Link from '@/lib/next-polyfills';
import { Icons } from '@/config/icon-config';

const StatCard = memo(function StatCard({ stat }) {
  const StatIcon = Icons[stat.icon] || Icons.file;
  return (
    <UnstyledButton component={Link} href={stat.href}>
      <Paper p="md" withBorder style={{ cursor: 'pointer' }}>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>{stat.name}</Text>
          <ThemeIcon variant="light" color={stat.color} size="sm">
            <StatIcon size={14} />
          </ThemeIcon>
        </Group>
        <Text size="xl" fw={700}>{stat.count}</Text>
        <Text size="xs" c="dimmed">Total active</Text>
      </Paper>
    </UnstyledButton>
  );
});

export function StatsGrid({ stats }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      {stats.map((stat) => (
        <StatCard key={stat.name} stat={stat} />
      ))}
    </SimpleGrid>
  );
}
