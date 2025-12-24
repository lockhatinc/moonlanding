import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { DebugInit } from '@/components/debug-init';
import { ServiceWorkerRegister } from '@/components/service-worker-register';
import { OfflineBanner } from '@/components/offline-banner';

export const metadata = {
  title: 'Platform',
  description: 'Ultra-Minimal Unified Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <ServiceWorkerRegister />
          <DebugInit />
          <Notifications position="top-right" />
          <OfflineBanner />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
