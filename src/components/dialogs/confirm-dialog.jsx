'use client';

import { Modal, Button, Stack, Group, Text, ThemeIcon } from '@mantine/core';
import { STATUS_ICONS, ACTION_ICONS } from '@/config/icon-config';
import { useEffect } from 'react';

export function ConfirmDialog({
  opened,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
  loading = false,
}) {
  // Handle Escape key to close dialog
  useEffect(() => {
    if (!opened || loading) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [opened, loading, onCancel]);

  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title={title}
      centered
      size="sm"
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        {isDangerous && (
          <Group gap="xs">
            <ThemeIcon size="lg" radius="md" variant="light" color="red">
              <STATUS_ICONS.warning size={20} />
            </ThemeIcon>
            <Text fw={500} c="red">This action cannot be undone</Text>
          </Group>
        )}

        <Text>{message}</Text>

        <Group justify="flex-end" gap="sm">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            color={isDangerous ? 'red' : 'blue'}
            onClick={onConfirm}
            loading={loading}
            leftSection={isDangerous ? <STATUS_ICONS.error size={16} /> : undefined}
          >
            {confirmText}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function useConfirmDialog() {
  const [state, setState] = React.useState({
    opened: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDangerous: false,
    onConfirm: null,
    onCancel: null,
    loading: false,
  });

  const confirm = React.useCallback((options) => {
    return new Promise((resolve) => {
      setState(prev => ({
        ...prev,
        opened: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        isDangerous: options.isDangerous || false,
        onConfirm: async () => {
          setState(prev => ({ ...prev, loading: true }));
          try {
            const result = options.onConfirm && await options.onConfirm();
            setState(prev => ({ ...prev, opened: false, loading: false }));
            resolve(true);
          } catch (e) {
            setState(prev => ({ ...prev, loading: false }));
            throw e;
          }
        },
        onCancel: () => {
          setState(prev => ({ ...prev, opened: false }));
          resolve(false);
        },
      }));
    });
  }, []);

  return { ...state, confirm };
}
