'use client';

import { useDisclosure } from '@mantine/hooks';
import { AppShell, Burger, Group, Avatar, Menu, UnstyledButton, Text, Box } from '@mantine/core';
import Link from 'next/link';
import { Nav } from './nav';
import { LogOut, User, Settings } from 'lucide-react';

export function Shell({ children, user, nav = [] }) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Group gap="xs">
                <Box
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--mantine-color-blue-filled)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  P
                </Box>
                <Text fw={600}>Platform</Text>
              </Group>
            </Link>
          </Group>

          {user && (
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Avatar src={user.avatar} alt={user.name} radius="xl" size="sm">
                    {user.name?.[0] || user.email?.[0] || '?'}
                  </Avatar>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <Text size="sm" fw={500}>{user.name}</Text>
                  <Text size="xs" c="dimmed">{user.email}</Text>
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item leftSection={<User size={14} />}>Profile</Menu.Item>
                <Menu.Item leftSection={<Settings size={14} />}>Settings</Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<LogOut size={14} />}
                  component={Link}
                  href="/api/auth/logout"
                  c="red"
                >
                  Log out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Nav items={nav} />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
