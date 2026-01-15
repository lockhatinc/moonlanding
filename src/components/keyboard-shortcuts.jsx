'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Stack, Text, Group, Badge, Input, Button, ScrollArea, Center, Loader } from '@mantine/core';
import { ACTION_ICONS, NAVIGATION_ICONS } from '@/config/icon-config';

const KEYBOARD_SHORTCUTS = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['Escape'], description: 'Close modal or dialog' },
      { keys: ['Cmd/Ctrl', 'K'], description: 'Global search' },
      { keys: ['Cmd/Ctrl', 'Enter'], description: 'Submit form' },
      { keys: ['Backspace'], description: 'Go back to previous page' },
    ]
  },
  {
    category: 'Lists & Tables',
    shortcuts: [
      { keys: ['Enter'], description: 'Open selected row' },
      { keys: ['Space'], description: 'Toggle row selection' },
      { keys: ['↑', '↓'], description: 'Navigate rows' },
      { keys: ['Ctrl', 'A'], description: 'Select all rows' },
    ]
  },
  {
    category: 'Forms',
    shortcuts: [
      { keys: ['Tab'], description: 'Move to next field' },
      { keys: ['Shift', 'Tab'], description: 'Move to previous field' },
      { keys: ['Cmd/Ctrl', 'Enter'], description: 'Submit form' },
    ]
  },
];

export function KeyboardShortcutsModal({ opened, onClose }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <ScrollArea>
        <Stack gap="lg" pr="md">
          {KEYBOARD_SHORTCUTS.map(section => (
            <Stack key={section.category} gap="sm">
              <Text fw={600} size="sm" c="dimmed" tt="uppercase" ls={0.5}>
                {section.category}
              </Text>
              <Stack gap="xs">
                {section.shortcuts.map(({ keys, description }, idx) => (
                  <Group justify="space-between" key={idx}>
                    <Text size="sm">{description}</Text>
                    <Group gap={4}>
                      {keys.map((key, kidx) => (
                        <React.Fragment key={kidx}>
                          <Badge size="sm" variant="light" style={{ fontFamily: 'monospace' }}>
                            {key}
                          </Badge>
                          {kidx < keys.length - 1 && <Text size="xs">+</Text>}
                        </React.Fragment>
                      ))}
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </ScrollArea>
    </Modal>
  );
}

export function useKeyboardShortcuts() {
  const [shortcutsOpened, setShortcutsOpened] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: Trigger search
        console.log('[Keyboard] Search triggered');
      }

      // Cmd+Enter or Ctrl+Enter for submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const submitBtn = document.querySelector('button[type="submit"], button[data-submit="true"]');
        if (submitBtn) {
          submitBtn.click();
        }
      }

      // ? for help/shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShortcutsOpened(true);
        }
      }

      // Escape in modals/dialogs handled by Mantine Modal closeOnEscape
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    shortcutsOpened,
    openShortcuts: () => setShortcutsOpened(true),
    closeShortcuts: () => setShortcutsOpened(false),
  };
}
