import { count } from '@/engine';
import { getUser } from '@/engine.server';
import { getNavItems, specs } from '@/specs';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/layout';
import { Paper, Title, Text, SimpleGrid, Group, Stack, ThemeIcon, Box, UnstyledButton } from '@mantine/core';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { File, Activity, Users, Briefcase, FileSearch, Building } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const navItems = getNavItems();

  const stats = [
    { name: 'Engagements', icon: Briefcase, count: count('engagement'), href: '/engagement', color: 'blue' },
    { name: 'Reviews', icon: FileSearch, count: count('review'), href: '/review', color: 'violet' },
    { name: 'Clients', icon: Building, count: count('client'), href: '/client', color: 'green' },
    { name: 'Users', icon: Users, count: count('user'), href: '/user', color: 'orange' },
  ];

  const recentItems = [
    { type: 'engagement', action: 'created', time: 'Just now' },
    { type: 'review', action: 'updated', time: '5 minutes ago' },
    { type: 'client', action: 'created', time: '1 hour ago' },
  ];

  return (
    <Shell user={user} nav={navItems}>
      <Stack gap="lg">
        <Box>
          <Title order={1}>Dashboard</Title>
          <Text c="dimmed">Welcome back, {user.name}</Text>
        </Box>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {stats.map((stat) => (
            <UnstyledButton key={stat.name} component={Link} href={stat.href}>
              <Paper p="md" withBorder style={{ cursor: 'pointer' }}>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>{stat.name}</Text>
                  <ThemeIcon variant="light" color={stat.color} size="sm">
                    <stat.icon size={14} />
                  </ThemeIcon>
                </Group>
                <Text size="xl" fw={700}>{stat.count}</Text>
                <Text size="xs" c="dimmed">Total active</Text>
              </Paper>
            </UnstyledButton>
          ))}
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Paper p="md" withBorder>
            <Title order={4} mb="md">Quick Actions</Title>
            <Stack gap="xs">
              <UnstyledButton component={Link} href="/engagement/new">
                <Group p="sm" style={{ borderRadius: 8 }} className="hover-bg">
                  <ThemeIcon size={40} radius="md" color="blue" variant="light">
                    <Briefcase size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={500}>New Engagement</Text>
                    <Text size="sm" c="dimmed">Start a new engagement</Text>
                  </Box>
                </Group>
              </UnstyledButton>
              <UnstyledButton component={Link} href="/review/new">
                <Group p="sm" style={{ borderRadius: 8 }} className="hover-bg">
                  <ThemeIcon size={40} radius="md" color="violet" variant="light">
                    <FileSearch size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={500}>New Review</Text>
                    <Text size="sm" c="dimmed">Create a new review</Text>
                  </Box>
                </Group>
              </UnstyledButton>
              <UnstyledButton component={Link} href="/client/new">
                <Group p="sm" style={{ borderRadius: 8 }} className="hover-bg">
                  <ThemeIcon size={40} radius="md" color="green" variant="light">
                    <Building size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={500}>New Client</Text>
                    <Text size="sm" c="dimmed">Add a new client</Text>
                  </Box>
                </Group>
              </UnstyledButton>
            </Stack>
          </Paper>

          <Paper p="md" withBorder>
            <Group mb="md">
              <Activity size={20} />
              <Title order={4}>Recent Activity</Title>
            </Group>
            <Stack gap="md">
              {recentItems.map((item, i) => {
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
              {recentItems.length === 0 && (
                <Text c="dimmed" ta="center" py="md">No recent activity</Text>
              )}
            </Stack>
          </Paper>
        </SimpleGrid>

        <Paper p="md" withBorder>
          <Title order={4} mb="md">All Entities</Title>
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="sm">
            {navItems.map((item) => {
              const Icon = Icons[item.icon] || File;
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
      </Stack>
    </Shell>
  );
}

export const metadata = {
  title: 'Dashboard',
};
