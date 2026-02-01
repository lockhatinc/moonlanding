'use client';

import { memo, useState } from 'react';
import { Paper, Stack, Group, Text, ActionIcon, Box, Popover, SimpleGrid, Menu } from '@mantine/core';
import { ACTION_ICONS } from '@/config/icon-config';
import { formatDate } from '@/lib/utils-client';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👀'];

const ReactionBubble = memo(({ emoji, count, onClick, isUserReacted }) => (
  <ActionIcon
    size="xs"
    variant={isUserReacted ? 'filled' : 'light'}
    color={isUserReacted ? 'blue' : 'gray'}
    onClick={onClick}
    style={{ fontSize: '12px', padding: '2px 6px', height: 'auto', minWidth: '24px' }}
  >
    {emoji} {count > 0 && <span>{count}</span>}
  </ActionIcon>
));

export const MessageItem = memo(({ msg, user, onReact, onEdit, onDelete, isEditing, editContent, onEditChange }) => {
  const [showReactions, setShowReactions] = useState(false);
  const reactions = msg.reactions || {};
  const reactionList = Object.entries(reactions).map(([emoji, users]) => ({ 
    emoji, 
    count: users.length, 
    users: Array.isArray(users) ? users : [] 
  }));

  const isOwner = msg.user_id === user?.id;
  const formatTime = (ts) => {
    if (!ts) return '';
    const timestamp = typeof ts === 'string' ? parseInt(ts) * 1000 : ts * 1000;
    return formatDate(timestamp, 'datetime') || new Date(timestamp).toLocaleString();
  };

  return (
    <Group key={msg.id} gap="sm" align="flex-start" style={{ flexDirection: isOwner ? 'row-reverse' : 'row' }}>
      <Box w={32} h={32} style={{ minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text size="sm" fw={500} ta="center">
          {msg.created_by_display?.name?.[0]?.toUpperCase() || '?'}
        </Text>
      </Box>
      <Box style={{ flex: 1, maxWidth: '70%' }}>
        <Group gap="xs" mb={4} style={{ justifyContent: isOwner ? 'flex-end' : 'flex-start' }}>
          <Text size="xs" c="dimmed" fw={500}>{msg.created_by_display?.name || 'Unknown'}</Text>
          <Text size="xs" c="dimmed">{formatTime(msg.created_at)}</Text>
          {isOwner && (
            <Menu shadow="md" position="bottom-end">
              <Menu.Target>
                <ActionIcon size="xs" variant="subtle" color="gray">
                  <ACTION_ICONS.dots size={14} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => onEdit(msg)}>Edit</Menu.Item>
                <Menu.Item color="red" onClick={() => onDelete(msg.id)}>Delete</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        {isEditing ? (
          <Group gap="xs" align="flex-end">
            <textarea
              value={editContent}
              onChange={(e) => onEditChange(e.target.value)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontFamily: 'inherit',
                fontSize: '14px',
                minHeight: '40px'
              }}
            />
            <ActionIcon
              size="sm"
              color="blue"
              onClick={() => onEdit(msg)}
            >
              <ACTION_ICONS.check size={16} />
            </ActionIcon>
          </Group>
        ) : (
          <>
            <Paper p="sm" bg={isOwner ? 'blue' : 'gray.1'} c={isOwner ? 'white' : undefined} radius="md">
              <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.content}
              </Text>
            </Paper>
            {msg.attachments && msg.attachments.length > 0 && (
              <Group gap="xs" mt={6}>
                {msg.attachments.map((attachment, idx) => (
                  <Paper key={idx} p="xs" bg="gray.2" radius="sm" style={{ fontSize: '12px' }}>
                    <ActionIcon size="xs" variant="subtle">
                      <ACTION_ICONS.paperclip size={12} />
                    </ActionIcon>
                    {' '}{attachment.name || `File ${idx + 1}`}
                  </Paper>
                ))}
              </Group>
            )}
          </>
        )}

        {reactionList.length > 0 && !isEditing && (
          <Group gap="xs" mt={6} wrap="wrap">
            {reactionList.map(({ emoji, count, users }) => (
              <ReactionBubble
                key={emoji}
                emoji={emoji}
                count={count}
                isUserReacted={users.includes(user?.id)}
                onClick={() => onReact(msg.id, emoji)}
              />
            ))}
          </Group>
        )}

        {!isEditing && (
          <Group gap="xs" mt={4}>
            <Popover position="bottom" withArrow>
              <Popover.Target>
                <ActionIcon size="xs" variant="subtle">
                  <ACTION_ICONS.emoji size={14} />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown p={8}>
                <SimpleGrid cols={4} spacing="xs">
                  {EMOJI_REACTIONS.map(emoji => (
                    <ActionIcon
                      key={emoji}
                      size="lg"
                      variant="light"
                      onClick={() => {
                        onReact(msg.id, emoji);
                        setShowReactions(false);
                      }}
                    >
                      {emoji}
                    </ActionIcon>
                  ))}
                </SimpleGrid>
              </Popover.Dropdown>
            </Popover>
          </Group>
        )}
      </Box>
    </Group>
  );
});
