import { memo } from 'react';
import { Paper, Title, SimpleGrid, UnstyledButton, Group, Text } from '@mantine/core';
import { Link } from '@/lib/next-polyfills';
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
              <Paper
                p="sm"
                withBorder
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Group>
                  <Icon size={20} color="var(--mantine-color-blue-6)" />
                  <Text fw={500} size="sm">{item.label}</Text>
                </Group>
              </Paper>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>
    </Paper>
  );
});

