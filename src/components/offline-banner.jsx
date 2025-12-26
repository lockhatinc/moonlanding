'use client';

import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import { Alert } from '@mantine/core';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <Alert
      variant="filled"
      color="red"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        borderRadius: 0,
        marginBottom: 0
      }}
    >
      Limited Functionality: You are offline. File uploads and letter generation disabled.
    </Alert>
  );
}
