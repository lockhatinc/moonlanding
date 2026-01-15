'use client';

import { usePathname, Link } from '@/lib/next-polyfills';
import { AppShell, Burger, Group, Avatar, Menu, Text, NavLink, Stack, UnstyledButton, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Icons, ACTION_ICONS, NAVIGATION_ICONS } from '@/config/icon-config';
import { LAYOUT } from '@/config';

export function Shell({ children, user, nav = [] }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  return (
    <AppShell header={{ height: LAYOUT.headerHeight }} navbar={{ width: LAYOUT.navbarWidth, breakpoint: 'sm', collapsed: { mobile: !opened } }} padding="md">
      <AppShell.Header style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
            <UnstyledButton component={Link} href="/" aria-label="Go to home">
              <Group gap="xs">
                <Box w={LAYOUT.iconBoxSize} h={LAYOUT.iconBoxSize} bg="blue" style={{ borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}>
                  <Text c="white" fw={700}>P</Text>
                </Box>
                <Text fw={600} visibleFrom="sm">Platform</Text>
              </Group>
            </UnstyledButton>
          </Group>
          <Menu shadow="md" width={LAYOUT.menuWidth}>
            <Menu.Target>
              <UnstyledButton aria-label="User menu">
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
              <Menu.Item leftSection={<Icons.user size={14} />} aria-label="View profile">Profile</Menu.Item>
              <Menu.Item leftSection={<ACTION_ICONS.settings size={14} />} aria-label="Open settings">Settings</Menu.Item>
              <Menu.Divider />
              <Menu.Item component="a" href="/api/auth/logout" leftSection={<ACTION_ICONS.logout size={14} />} color="red" aria-label="Sign out">Logout</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ borderRight: '1px solid var(--mantine-color-gray-2)' }}>
        <Stack gap={4}>
          <NavLink
            component={Link}
            href="/"
            label="Dashboard"
            leftSection={<ACTION_ICONS.dashboard size={18} />}
            active={pathname === '/'}
            aria-current={pathname === '/' ? 'page' : undefined}
          />
          {nav.map((item) => {
            const Icon = Icons[item.icon] || Icons.file;
            const isActive = pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.name}
                component={Link}
                href={item.href}
                label={item.label}
                leftSection={<Icon size={18} />}
                active={isActive}
                aria-current={isActive ? 'page' : undefined}
              />
            );
          })}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>{children}</AppShell.Main>
    </AppShell>
  );
}

