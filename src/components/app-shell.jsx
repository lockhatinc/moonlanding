'use client';

import { useEffect, useState, Suspense } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { ErrorBoundary } from '@/components/error-boundary';
import { ToastContainer } from '@/components/toast-container';
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts';
import { DebugInit } from '@/components/debug-init';
import '@/app/globals.css';

export function AppShell({ children, pathname, params }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body style={{ margin: 0, padding: 0, background: '#f8f9fa', minHeight: '100vh' }} />
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <title>Platform</title>
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <MantineProvider>
          <Notifications />
          <ErrorBoundary>
            <Suspense fallback={<div>Loading...</div>}>
              {children}
              <DebugInit />
              <ToastContainer />
              <KeyboardShortcuts />
            </Suspense>
          </ErrorBoundary>
        </MantineProvider>
      </body>
    </html>
  );
}
