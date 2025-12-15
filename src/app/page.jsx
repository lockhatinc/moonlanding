import { count } from '@/engine';
import { getUser } from '@/engine.server';
import { getNavItems } from '@/config';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/layout';
import { Box, Title, Text, SimpleGrid, Stack } from '@mantine/core';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { AllEntities } from '@/components/dashboard/all-entities';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const navItems = getNavItems();
  const stats = [
    { name: 'Engagements', icon: 'Briefcase', count: count('engagement'), href: '/engagement', color: 'blue' },
    { name: 'Reviews', icon: 'FileSearch', count: count('review'), href: '/review', color: 'violet' },
    { name: 'Clients', icon: 'Building', count: count('client'), href: '/client', color: 'green' },
    { name: 'Users', icon: 'Users', count: count('user'), href: '/user', color: 'orange' },
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

        <StatsGrid stats={stats} />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <QuickActions />
          <RecentActivity items={recentItems} />
        </SimpleGrid>

        <AllEntities navItems={navItems} />
      </Stack>
    </Shell>
  );
}

export const metadata = {
  title: 'Dashboard',
};
