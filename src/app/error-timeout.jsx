'use client';

import { Container, Stack, Group, Button, Text, Title, ThemeIcon, Alert } from '@mantine/core';
import { NAVIGATION_ICONS, ACTION_ICONS, STATUS_ICONS } from '@/config/icon-config';

export default function TimeoutError({ reset }) {
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg" align="center" justify="center" style={{ minHeight: '70vh' }}>
        <ThemeIcon
          size={120}
          radius="md"
          variant="light"
          color="yellow"
        >
          <STATUS_ICONS.timeout size={60} />
        </ThemeIcon>

        <Stack gap="sm" align="center">
          <Title order={1} size="h2">Request Timed Out</Title>
          <Text c="dimmed" size="lg" ta="center">
            The request took too long to complete. Please try again.
          </Text>
        </Stack>

        <Alert
          icon={<STATUS_ICONS.info size={16} />}
          title="Troubleshooting tips:"
          color="blue"
          style={{ width: '100%' }}
        >
          <Stack gap="xs" size="sm">
            <Text>Check your internet connection and try again.</Text>
            <Text>If the problem persists, try refreshing the page.</Text>
          </Stack>
        </Alert>

        <Group gap="sm">
          <Button
            leftSection={<ACTION_ICONS.refresh size={16} />}
            onClick={() => reset?.() || window.location.reload()}
          >
            Try Again
          </Button>
          <Button
            variant="light"
            leftSection={<ACTION_ICONS.home size={16} />}
            onClick={() => window.location.href = '/'}
          >
            Go Home
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
