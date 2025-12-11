import { getUser } from '@/engine/auth';
import { getNavItems, specs } from '@/engine/spec';
import { count } from '@/engine/crud';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/layout/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { File, Activity, Users, Briefcase, FileSearch, Building } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const navItems = getNavItems();

  // Get counts for main entities
  const stats = [
    {
      name: 'Engagements',
      icon: Briefcase,
      count: count('engagement'),
      href: '/engagement',
      color: 'text-blue-600',
    },
    {
      name: 'Reviews',
      icon: FileSearch,
      count: count('review'),
      href: '/review',
      color: 'text-purple-600',
    },
    {
      name: 'Clients',
      icon: Building,
      count: count('client'),
      href: '/client',
      color: 'text-green-600',
    },
    {
      name: 'Users',
      icon: Users,
      count: count('user'),
      href: '/user',
      color: 'text-orange-600',
    },
  ];

  // Recent activity placeholder
  const recentItems = [
    { type: 'engagement', action: 'created', time: 'Just now' },
    { type: 'review', action: 'updated', time: '5 minutes ago' },
    { type: 'client', action: 'created', time: '1 hour ago' },
  ];

  return (
    <Shell user={user} nav={navItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.name} href={stat.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <p className="text-xs text-muted-foreground">Total active</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/engagement/new"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">New Engagement</p>
                  <p className="text-sm text-muted-foreground">Start a new engagement</p>
                </div>
              </Link>
              <Link
                href="/review/new"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FileSearch className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">New Review</p>
                  <p className="text-sm text-muted-foreground">Create a new review</p>
                </div>
              </Link>
              <Link
                href="/client/new"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Building className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">New Client</p>
                  <p className="text-sm text-muted-foreground">Add a new client</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentItems.map((item, i) => {
                  const ItemIcon = Icons[specs[item.type]?.icon] || File;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <ItemIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium capitalize">{item.type}</span>{' '}
                          {item.action}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
                {recentItems.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Entity Overview */}
        <Card>
          <CardHeader>
            <CardTitle>All Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              {navItems.map((item) => {
                const Icon = Icons[item.icon] || File;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

export const metadata = {
  title: 'Dashboard',
};
