'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AppShell, Burger, Group, Avatar, Menu, Text, NavLink, Stack, UnstyledButton, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Icons, ACTION_ICONS, NAVIGATION_ICONS } from '@/config/icon-config';
import { LAYOUT } from '@/config';

export function Shell({ children, user, nav = [] }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  return (
    <AppShell header={{ height: LAYOUT.headerHeight }} navbar={{ width: LAYOUT.navbarWidth, breakpoint: 'sm', collapsed: { mobile: !opened } }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <UnstyledButton component={Link} href="/">
              <Group gap="xs">
                <Box w={LAYOUT.iconBoxSize} h={LAYOUT.iconBoxSize} bg="blue" style={{ borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text c="white" fw={700}>P</Text>
                </Box>
                <Text fw={600} visibleFrom="sm">Platform</Text>
              </Group>
            </UnstyledButton>
          </Group>
          <Menu shadow="md" width={LAYOUT.menuWidth}>
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs">
                  <Avatar src={user?.avatar} size="sm" radius="xl">{user?.name?.[0] || '?'}</Avatar>
                  <Box visibleFrom="sm">
                    <Text size="sm" fw={500}>{user?.name || 'User'}</Text>
                    <Text size="xs" c="dimmed">{user?.role || 'Role'}</Text>
                  </Box>
                  <NAVIGATION_ICONS.chevronDown size={16} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
              <Menu.Item leftSection={<Icons.user size={14} />}>Profile</Menu.Item>
              <Menu.Item leftSection={<ACTION_ICONS.settings size={14} />}>Settings</Menu.Item>
              <Menu.Divider />
              <Menu.Item component="a" href="/api/auth/logout" leftSection={<ACTION_ICONS.logout size={14} />} color="red">Logout</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={4}>
          <NavLink component={Link} href="/" label="Dashboard" leftSection={<ACTION_ICONS.dashboard size={18} />} active={pathname === '/'} />
          {nav.map((item) => {
            const Icon = Icons[item.icon] || Icons.file;
            return <NavLink key={item.name} component={Link} href={item.href} label={item.label} leftSection={<Icon size={18} />} active={pathname.startsWith(item.href)} />;
          })}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
