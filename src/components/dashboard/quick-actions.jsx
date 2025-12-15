import { Paper, Title, Stack, UnstyledButton, Group, ThemeIcon, Box, Text } from '@mantine/core';
import Link from 'next/link';
import { Briefcase, FileSearch, Building } from 'lucide-react';

const ACTIONS = [
  {
    label: 'New Engagement',
    description: 'Start a new engagement',
    href: '/engagement/new',
    icon: Briefcase,
    color: 'blue',
  },
  {
    label: 'New Review',
    description: 'Create a new review',
    href: '/review/new',
    icon: FileSearch,
    color: 'violet',
  },
  {
    label: 'New Client',
    description: 'Add a new client',
    href: '/client/new',
    icon: Building,
    color: 'green',
  },
];

export function QuickActions() {
  return (
    <Paper p="md" withBorder>
      <Title order={4} mb="md">Quick Actions</Title>
      <Stack gap="xs">
        {ACTIONS.map((action) => (
          <UnstyledButton key={action.label} component={Link} href={action.href}>
            <Group p="sm" style={{ borderRadius: 8 }} className="hover-bg">
              <ThemeIcon size={40} radius="md" color={action.color} variant="light">
                <action.icon size={20} />
              </ThemeIcon>
              <Box>
                <Text fw={500}>{action.label}</Text>
                <Text size="sm" c="dimmed">{action.description}</Text>
              </Box>
            </Group>
          </UnstyledButton>
        ))}
      </Stack>
    </Paper>
  );
}
