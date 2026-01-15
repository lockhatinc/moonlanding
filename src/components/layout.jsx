'use client';

import React from 'react';
import { usePathname, Link } from '@/lib/next-polyfills';
import { AppShell, Burger, Group, Avatar, Menu, Text, NavLink, Stack, UnstyledButton, Box, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Icons, ACTION_ICONS, NAVIGATION_ICONS } from '@/config/icon-config';
import { LAYOUT } from '@/config';
import { ToastContainer } from './toast-container';
import { KeyboardShortcutsModal, useKeyboardShortcuts } from './keyboard-shortcuts';
import { ErrorBoundary } from './error-boundary';

export function Shell({ children, user, nav = [] }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const { shortcutsOpened, openShortcuts, closeShortcuts } = useKeyboardShortcuts();

  return (
    <>
    <AppShell header={{ height: LAYOUT.headerHeight }} navbar={{ width: LAYOUT.navbarWidth, breakpoint: 'sm', collapsed: { mobile: !opened } }} padding="md">
      {/* Skip to main content link for accessibility */}
      <Button
        component={Link}
        href="#main-content"
        size="xs"
        style={{
          position: 'absolute',
          top: '-40px',
          left: 0,
          zIndex: 9999,
        }}
        onFocus={(e) => {
          e.currentTarget.style.top = '0';
        }}
        onBlur={(e) => {
          e.currentTarget.style.top = '-40px';
        }}
      >
        Skip to main content
      </Button>

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

      <AppShell.Main style={{ backgroundColor: 'var(--mantine-color-gray-0)' }} id="main-content">
        <ErrorBoundary>{children}</ErrorBoundary>
      </AppShell.Main>
    </AppShell>

    <ToastContainer />

    <KeyboardShortcutsModal opened={shortcutsOpened} onClose={closeShortcuts} />

    <Group
      justify="center"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <Button
        size="xs"
        variant="subtle"
        onClick={openShortcuts}
        style={{ pointerEvents: 'auto' }}
        title="Press ? for keyboard shortcuts"
      >
        Press ? for help
      </Button>
    </Group>
    </>
  );
}

