import React from 'react';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';

export function OfflineIndicator() {
  const { isOnline, isChecking } = useOnlineStatus({
    checkInterval: 5000
  });

  if (isOnline) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ff6b6b',
        color: 'white',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: 500,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
    >
      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }}></span>
      You are offline. Some features may be limited.
      {isChecking && <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.8 }}>Checking...</span>}
    </div>
  );
}

export default OfflineIndicator;
