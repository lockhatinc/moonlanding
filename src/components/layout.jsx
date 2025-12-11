'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AppShell, Burger, Group, Avatar, Menu, Text, NavLink, Stack, UnstyledButton, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as Icons from 'lucide-react';
import { LogOut, Settings, User, ChevronDown, File, LayoutDashboard } from 'lucide-react';

export function Shell({ children, user, nav = [] }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <UnstyledButton component={Link} href="/">
              <Group gap="xs">
                <Box w={32} h={32} bg="blue" style={{ borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text c="white" fw={700}>P</Text>
                </Box>
                <Text fw={600} visibleFrom="sm">Platform</Text>
              </Group>
            </UnstyledButton>
          </Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs">
                  <Avatar src={user?.avatar} size="sm" radius="xl">{user?.name?.[0] || '?'}</Avatar>
                  <Box visibleFrom="sm">
                    <Text size="sm" fw={500}>{user?.name || 'User'}</Text>
                    <Text size="xs" c="dimmed">{user?.role || 'Role'}</Text>
                  </Box>
                  <ChevronDown size={16} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
              <Menu.Item leftSection={<User size={14} />}>Profile</Menu.Item>
              <Menu.Item leftSection={<Settings size={14} />}>Settings</Menu.Item>
              <Menu.Divider />
              <Menu.Item component="a" href="/api/auth/logout" leftSection={<LogOut size={14} />} color="red">Logout</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={4}>
          <NavLink component={Link} href="/" label="Dashboard" leftSection={<LayoutDashboard size={18} />} active={pathname === '/'} />
          {nav.map((item) => {
            const Icon = Icons[item.icon] || File;
            return <NavLink key={item.name} component={Link} href={item.href} label={item.label} leftSection={<Icon size={18} />} active={pathname.startsWith(item.href)} />;
          })}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
