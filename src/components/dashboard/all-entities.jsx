import { memo } from 'react';
import { Paper, Title, SimpleGrid, UnstyledButton, Group, Text } from '@mantine/core';
import Link from '@/lib/next-polyfills';
import { Icons } from '@/config/icon-config';

export const AllEntities = memo(function AllEntities({ navItems }) {
  return (
    <Paper p="md" withBorder>
      <Title order={4} mb="md">All Entities</Title>
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="sm">
        {navItems.map((item) => {
          const Icon = Icons[item.icon] || Icons.file;
          return (
            <UnstyledButton key={item.name} component={Link} href={item.href}>
              <Paper p="sm" withBorder style={{ cursor: 'pointer' }}>
                <Group>
                  <Icon size={20} color="var(--mantine-color-dimmed)" />
                  <Text fw={500}>{item.label}</Text>
                </Group>
              </Paper>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>
    </Paper>
  );
});
