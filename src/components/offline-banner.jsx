'use client';

import { Alert } from '@mantine/core';
import { ACTION_ICONS } from '@/config/icon-config';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';

export function OfflineBanner({ customMessage }) {
  const { isOffline } = useOnlineStatus();

  if (!isOffline) {
    return null;
  }

  const defaultMessage = 'You are offline. Limited functionality available.';
  const message = customMessage || defaultMessage;

  return (
    <Alert
      icon={<ACTION_ICONS.wifi size={20} />}
      title="Offline Mode"
      color="yellow"
      variant="filled"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderRadius: 0,
      }}
    >
      {message}
    </Alert>
  );
}

export function OnlineIndicator() {
  const { isOnline, isOffline } = useOnlineStatus();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: isOnline ? '#2f9e44' : '#f59f00',
      }}
    >
      {isOnline ? (
        <>
          <ACTION_ICONS.check size={16} />
          <span>Online</span>
        </>
      ) : (
        <>
          <ACTION_ICONS.wifi size={16} />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
