'use client';

import { Container, Stack, Group, Button, Text, Title, ThemeIcon, Alert, Code } from '@mantine/core';
import { NAVIGATION_ICONS, ACTION_ICONS, STATUS_ICONS } from '@/config/icon-config';

export default function ServerError({ error, reset }) {
  const errorId = `ERR-${Date.now()}`;

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg" align="center" justify="center" style={{ minHeight: '70vh' }}>
        <ThemeIcon
          size={120}
          radius="md"
          variant="light"
          color="red"
        >
          <STATUS_ICONS.error size={60} />
        </ThemeIcon>

        <Stack gap="sm" align="center">
          <Title order={1} size="h2">Something Went Wrong</Title>
          <Text c="dimmed" size="lg" ta="center">
            We encountered an unexpected error while processing your request.
          </Text>
        </Stack>

        {error && (
          <Alert
            icon={<STATUS_ICONS.cancelled size={16} />}
            title="Error Details"
            color="red"
            style={{ width: '100%' }}
          >
            <Stack gap="sm">
              <Text size="sm">{error.message || 'Unknown error'}</Text>
              <Code size="xs" style={{ width: '100%', padding: '8px', borderRadius: '4px' }}>
                {errorId}
              </Code>
            </Stack>
          </Alert>
        )}

        <Group gap="sm">
          <Button
            leftSection={<ACTION_ICONS.refresh size={16} />}
            onClick={() => reset?.()}
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

        <Stack gap="xs" style={{ width: '100%' }}>
          <Text fw={500} size="sm" c="dimmed">Error ID: {errorId}</Text>
          <Text size="xs" c="dimmed" ta="center">
            Please reference this error ID if you contact support.
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}
