'use client';

import { Container, Stack, Group, Button, Text, Title, ThemeIcon, Alert } from '@mantine/core';
import { NAVIGATION_ICONS, ACTION_ICONS, STATUS_ICONS } from '@/config/icon-config';

export default function PermissionDenied() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg" align="center" justify="center" style={{ minHeight: '70vh' }}>
        <ThemeIcon
          size={120}
          radius="md"
          variant="light"
          color="orange"
        >
          <STATUS_ICONS.blocked size={60} />
        </ThemeIcon>

        <Stack gap="sm" align="center">
          <Title order={1} size="h2">Access Denied</Title>
          <Text c="dimmed" size="lg" ta="center">
            You don't have permission to access this resource.
          </Text>
        </Stack>

        <Alert
          icon={<STATUS_ICONS.info size={16} />}
          title="What you can do:"
          color="blue"
          style={{ width: '100%' }}
        >
          <Stack gap="xs">
            <Text size="sm">
              If you believe this is an error, please contact your administrator or try logging in with a different account.
            </Text>
            <Group gap="xs">
              <Button
                size="sm"
                variant="subtle"
                onClick={() => window.location.href = '/api/auth/logout'}
              >
                Sign out
              </Button>
            </Group>
          </Stack>
        </Alert>

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
      </Stack>
    </Container>
  );
}
