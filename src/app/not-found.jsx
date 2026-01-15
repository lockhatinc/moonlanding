'use client';

import { Container, Stack, Group, Button, Text, Title, ThemeIcon } from '@mantine/core';
import { NAVIGATION_ICONS, ACTION_ICONS } from '@/config/icon-config';

export default function NotFound() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg" align="center" justify="center" style={{ minHeight: '70vh' }}>
        <ThemeIcon
          size={120}
          radius="md"
          variant="light"
          color="gray"
        >
          <NAVIGATION_ICONS.notFound size={60} />
        </ThemeIcon>

        <Stack gap="sm" align="center">
          <Title order={1} size="h2">Page Not Found</Title>
          <Text c="dimmed" size="lg" ta="center">
            The page you're looking for doesn't exist or may have been moved.
          </Text>
        </Stack>

        <Group gap="sm">
          <Button
            variant="light"
            leftSection={<ACTION_ICONS.home size={16} />}
            onClick={() => window.location.href = '/'}
          >
            Go Home
          </Button>
          <Button
            variant="outline"
            leftSection={<NAVIGATION_ICONS.back size={16} />}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </Group>

        <Stack gap="xs" style={{ width: '100%' }}>
          <Text fw={500} size="sm" c="dimmed">Helpful links:</Text>
          <Group gap="xs">
            <Button
              variant="subtle"
              size="sm"
              leftSection={<ACTION_ICONS.dashboard size={14} />}
              onClick={() => window.location.href = '/dashboard'}
            >
              Dashboard
            </Button>
            <Button
              variant="subtle"
              size="sm"
              leftSection={<ACTION_ICONS.settings size={14} />}
              onClick={() => window.location.href = '/settings'}
            >
              Settings
            </Button>
          </Group>
        </Stack>
      </Stack>
    </Container>
  );
}
