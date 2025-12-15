import { Paper, Group, Title, Stack, Text, ThemeIcon, Box } from '@mantine/core';
import { Activity, File } from 'lucide-react';
import * as Icons from 'lucide-react';
import { specs } from '@/config';

export function RecentActivity({ items = [] }) {
  return (
    <Paper p="md" withBorder>
      <Group mb="md">
        <Activity size={20} />
        <Title order={4}>Recent Activity</Title>
      </Group>
      <Stack gap="md">
        {items.map((item, i) => {
          const ItemIcon = Icons[specs[item.type]?.icon] || File;
          return (
            <Group key={i}>
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
        })}
        {items.length === 0 && (
          <Text c="dimmed" ta="center" py="md">No recent activity</Text>
        )}
      </Stack>
    </Paper>
  );
}
