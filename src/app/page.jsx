import dynamicImport from 'next/dynamic';
import { count } from '@/engine';
import { getUser } from '@/engine.server';
import { getNavItems } from '@/config';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/layout';
import { Box, Title, Text, SimpleGrid, Stack } from '@mantine/core';
import { AllEntities } from '@/components/dashboard/all-entities';

const StatsGrid = dynamicImport(() => import('@/components/dashboard/stats-grid').then(m => ({ default: m.StatsGrid })), { ssr: true });
const QuickActions = dynamicImport(() => import('@/components/dashboard/quick-actions').then(m => ({ default: m.QuickActions })), { ssr: true });
const RecentActivity = dynamicImport(() => import('@/components/dashboard/recent-activity').then(m => ({ default: m.RecentActivity })), { ssr: true });

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const navItems = getNavItems();
  const [engagementCount, reviewCount, clientCount, userCount] = await Promise.all([
    count('engagement'),
    count('review'),
    count('client'),
    count('user'),
  ]);

  const stats = [
    { name: 'Engagements', icon: 'Briefcase', count: engagementCount, href: '/engagement', color: 'blue' },
    { name: 'Reviews', icon: 'FileSearch', count: reviewCount, href: '/review', color: 'violet' },
    { name: 'Clients', icon: 'Building', count: clientCount, href: '/client', color: 'green' },
    { name: 'Users', icon: 'Users', count: userCount, href: '/user', color: 'orange' },
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
