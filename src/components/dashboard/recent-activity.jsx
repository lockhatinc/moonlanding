import { memo } from 'react';
import { Paper, Group, Title, Stack, Text, ThemeIcon, Box } from '@mantine/core';
import { Icons, ACTION_ICONS } from '@/config/icon-config';
import { specs } from '@/config';

const ActivityItem = memo(function ActivityItem({ item, index }) {
  const ItemIcon = Icons[specs[item.type]?.icon] || Icons.file;
  return (
    <Group key={index}>
      <ThemeIcon variant="light" color="gray" radius="xl" size="md">
        <ItemIcon size={14} />
      </ThemeIcon>
      <Box flex={1}>
        <Text size="sm">
          <Text span fw={500} tt="capitalize">{item.type}</Text> {item.action}
        </Text>
        <Text size="xs" c="dimmed">{item.time}</Text>
      </Box>
    </Group>
  );
});

export function RecentActivity({ items = [] }) {
  return (
    <Paper p="md" withBorder>
      <Group mb="md">
        <ACTION_ICONS.activity size={20} />
        <Title order={4}>Recent Activity</Title>
      </Group>
      <Stack gap="md">
        {items.map((item, i) => (
          <ActivityItem key={i} item={item} index={i} />
        ))}
        {items.length === 0 && (
          <Text c="dimmed" ta="center" py="md">No recent activity</Text>
        )}
      </Stack>
    </Paper>
  );
}
