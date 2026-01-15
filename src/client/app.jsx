import React from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';

/**
 * App wrapper that provides Mantine theming and notification system
 * Page content is server-rendered and injected into #__next by page-renderer.js
 * Client-side only handles provider setup and interactivity
 */
export function App() {
  return (
    <MantineProvider>
      <ModalsProvider>
        <Notifications />
      </ModalsProvider>
    </MantineProvider>
  );
}
