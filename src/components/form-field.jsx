'use client';

import { Stack, Group, Text, Badge, Alert } from '@mantine/core';
import { STATUS_ICONS } from '@/config/icon-config';

export function FormField({
  label,
  error = null,
  required = false,
  helpText = null,
  children,
  validation = null,
}) {
  const showValidation = validation && validation !== true;

  return (
    <Stack gap="xs">
      <Group gap={4} wrap="nowrap">
        <Text fw={500} size="sm">{label}</Text>
        {required && <Badge size="xs" color="red">Required</Badge>}
        {showValidation && <Badge size="xs" color="orange">Invalid</Badge>}
      </Group>

      {children}

      {error && (
        <Alert
          icon={<STATUS_ICONS.cancelled size={14} />}
          color="red"
          title="Validation Error"
          size="sm"
        >
          {error}
        </Alert>
      )}

      {helpText && !error && (
        <Text c="dimmed" size="xs">{helpText}</Text>
      )}
    </Stack>
  );
}

export function FormFieldGroup({ children, title = null }) {
  return (
    <Stack gap="md">
      {title && <Text fw={600} size="sm" c="dimmed" tt="uppercase" ls={0.5}>{title}</Text>}
      {children}
    </Stack>
  );
}
