'use client';

import React, { useEffect } from 'react';
import { Alert, Stack, Group, Button, Text, Progress, Box } from '@mantine/core';
import { STATUS_ICONS, ACTION_ICONS } from '@/config/icon-config';

const TOAST_DURATION = 5000;
const TOAST_STAGGER = 100;

// Global toast store
let toastId = 0;
let toastListeners = [];

const toastStore = {
  toasts: [],
  add(toast) {
    const id = toastId++;
    const toastWithId = { ...toast, id };
    this.toasts.push(toastWithId);
    toastListeners.forEach(listener => listener([...this.toasts]));

    // Auto-dismiss non-persistent toasts
    if (!toast.persistent) {
      setTimeout(() => this.remove(id), toast.duration || TOAST_DURATION);
    }

    return id;
  },
  remove(id) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    toastListeners.forEach(listener => listener([...this.toasts]));
  },
  subscribe(listener) {
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }
};

export const toast = {
  success: (message, options = {}) => {
    return toastStore.add({
      type: 'success',
      message,
      ...options,
    });
  },
  error: (message, options = {}) => {
    return toastStore.add({
      type: 'error',
      message,
      persistent: true, // Errors are persistent by default
      ...options,
    });
  },
  info: (message, options = {}) => {
    return toastStore.add({
      type: 'info',
      message,
      ...options,
    });
  },
  warning: (message, options = {}) => {
    return toastStore.add({
      type: 'warning',
      message,
      ...options,
    });
  },
  loading: (message, options = {}) => {
    return toastStore.add({
      type: 'loading',
      message,
      persistent: true,
      ...options,
    });
  },
  remove: (id) => toastStore.remove(id),
  clear: () => {
    toastStore.toasts = [];
    toastListeners.forEach(listener => listener([]));
  }
};

export function useToasts() {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    return toastStore.subscribe(setToasts);
  }, []);

  return toasts;
}

function ToastItem({ toast, onDismiss }) {
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [progress, setProgress] = React.useState(100);

  useEffect(() => {
    if (toast.persistent) return;

    const startTime = Date.now();
    const duration = toast.duration || TOAST_DURATION;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [toast.persistent, toast.duration]);

  const colorMap = {
    success: 'green',
    error: 'red',
    info: 'blue',
    warning: 'orange',
    loading: 'blue',
  };

  const iconMap = {
    success: <STATUS_ICONS.success size={16} />,
    error: <STATUS_ICONS.error size={16} />,
    info: <STATUS_ICONS.info size={16} />,
    warning: <STATUS_ICONS.warning size={16} />,
    loading: <ACTION_ICONS.loading size={16} style={{ animation: 'spin 1s linear infinite' }} />,
  };

  const handleDismiss = () => {
    setIsRemoving(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <Box
      style={{
        animation: isRemoving ? 'slideOut 200ms ease-out forwards' : 'slideIn 200ms ease-out',
        opacity: isRemoving ? 0 : 1,
        marginBottom: '12px',
      }}
    >
      <Alert
        icon={iconMap[toast.type]}
        title={toast.title}
        color={colorMap[toast.type]}
        onClose={toast.persistent ? handleDismiss : undefined}
        closeButtonProps={toast.persistent ? { 'aria-label': 'Close alert' } : {}}
      >
        <Stack gap={4}>
          <Text size="sm">{toast.message}</Text>
          {toast.action && (
            <Button
              size="xs"
              variant="subtle"
              onClick={() => {
                toast.action.onClick?.();
                handleDismiss();
              }}
            >
              {toast.action.label}
            </Button>
          )}
          {!toast.persistent && (
            <Progress value={progress} size="xs" style={{ marginTop: '4px' }} />
          )}
        </Stack>
      </Alert>
    </Box>
  );
}

export function ToastContainer() {
  const toasts = useToasts();

  return (
    <Stack
      gap={0}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: '400px',
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          onDismiss={(id) => toastStore.remove(id)}
        />
      ))}
    </Stack>
  );
}
