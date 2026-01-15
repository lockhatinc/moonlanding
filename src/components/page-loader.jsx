'use client';

import { Center, Stack, Loader, Text } from '@mantine/core';

export function PageLoader({
  message = 'Loading...',
  fullPage = false,
  size = 'md',
}) {
  const minHeight = fullPage ? '100vh' : '400px';

  return (
    <Center style={{ minHeight, position: 'relative' }}>
      <Stack align="center" gap="md">
        <Loader size={size} />
        <Text c="dimmed" size="sm">{message}</Text>
      </Stack>
    </Center>
  );
}

export function ContentLoader({ rowCount = 5 }) {
  return (
    <Stack gap="md">
      {Array.from({ length: rowCount }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '20px',
            backgroundColor: 'var(--mantine-color-gray-2)',
            borderRadius: '4px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Stack>
  );
}
