'use client';

import { Stack, Group, Box } from '@mantine/core';

export function SkeletonRow({ columnCount = 5 }) {
  return (
    <Group gap="md" style={{ width: '100%' }}>
      {Array.from({ length: columnCount }).map((_, i) => (
        <Box
          key={i}
          style={{
            flex: 1,
            height: 16,
            backgroundColor: 'var(--mantine-color-gray-2)',
            borderRadius: 4,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      ))}
    </Group>
  );
}

export function SkeletonTable({ rowCount = 8, columnCount = 5 }) {
  return (
    <div style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: 'var(--mantine-color-gray-1)' }}>
          <tr>
            {Array.from({ length: columnCount }).map((_, i) => (
              <th
                key={i}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  borderBottom: '1px solid var(--mantine-color-gray-3)',
                }}
              >
                <Box
                  style={{
                    height: 12,
                    backgroundColor: 'var(--mantine-color-gray-3)',
                    borderRadius: 4,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIdx) => (
            <tr key={rowIdx} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
              {Array.from({ length: columnCount }).map((_, colIdx) => (
                <td
                  key={colIdx}
                  style={{
                    padding: '12px 16px',
                    height: 40,
                  }}
                >
                  <Box
                    style={{
                      height: 16,
                      backgroundColor: 'var(--mantine-color-gray-2)',
                      borderRadius: 4,
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <Stack gap="md">
      <div style={{ height: 32, backgroundColor: 'var(--mantine-color-gray-2)', borderRadius: 4, width: '30%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div style={{ padding: '16px', border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ height: 14, backgroundColor: 'var(--mantine-color-gray-3)', borderRadius: 4, width: '20%', marginBottom: 8, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            <div style={{ height: 16, backgroundColor: 'var(--mantine-color-gray-2)', borderRadius: 4, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Stack>
  );
}
