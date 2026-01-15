'use client';

import { Button } from '@mantine/core';
import { STATUS_ICONS } from '@/config/icon-config';
import React from 'react';
import { ConfirmDialog } from './dialogs/confirm-dialog';
import { toast } from './toast-container';

/**
 * Higher-order component for delete/destructive actions
 * Wraps any action with confirmation dialog and toast feedback
 */
export function DeleteButton({
  label = 'Delete',
  message = 'Are you sure? This action cannot be undone.',
  title = 'Confirm Delete',
  onDelete,
  loading = false,
  disabled = false,
  ...props
}) {
  const [confirmOpened, setConfirmOpened] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = React.useCallback(async () => {
    setDeleting(true);
    try {
      const toastId = toast.loading('Deleting...');
      await onDelete?.();
      toast.remove(toastId);
      toast.success('Item deleted successfully');
      setConfirmOpened(false);
    } catch (e) {
      toast.error(e.message || 'Failed to delete item');
    } finally {
      setDeleting(false);
    }
  }, [onDelete]);

  return (
    <>
      <Button
        color="red"
        variant="light"
        leftSection={<STATUS_ICONS.delete size={16} />}
        onClick={() => setConfirmOpened(true)}
        disabled={disabled || loading || deleting}
        loading={deleting}
        {...props}
      >
        {label}
      </Button>

      <ConfirmDialog
        opened={confirmOpened}
        title={title}
        message={message}
        confirmText="Delete"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpened(false)}
        loading={deleting}
      />
    </>
  );
}

/**
 * Hook for handling any destructive action with confirmation
 */
export function useDestructiveAction(message = 'Are you sure?', title = 'Confirm') {
  const [confirmOpened, setConfirmOpened] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const confirm = React.useCallback(async (action) => {
    return new Promise((resolve) => {
      setConfirmOpened(true);

      window.__destructiveActionResolve = async () => {
        setLoading(true);
        try {
          const result = await action?.();
          setConfirmOpened(false);
          resolve(result);
        } catch (e) {
          console.error('Destructive action error:', e);
          throw e;
        } finally {
          setLoading(false);
          window.__destructiveActionResolve = null;
        }
      };

      window.__destructiveActionCancel = () => {
        setConfirmOpened(false);
        window.__destructiveActionResolve = null;
        window.__destructiveActionCancel = null;
        resolve(null);
      };
    });
  }, []);

  return {
    confirmOpened,
    loading,
    confirm,
    setConfirmOpened,
    DialogComponent: (
      <ConfirmDialog
        opened={confirmOpened}
        title={title}
        message={message}
        confirmText="Confirm"
        isDangerous
        onConfirm={() => window.__destructiveActionResolve?.()}
        onCancel={() => window.__destructiveActionCancel?.()}
        loading={loading}
      />
    ),
  };
}
