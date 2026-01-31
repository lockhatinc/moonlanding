'use client';

import { useState, useCallback, memo, useEffect } from 'react';
import { Paper, Stack, Group, Text, ActionIcon, Avatar, Textarea, Box, Title, ScrollArea, Checkbox, Popover, SimpleGrid } from '@mantine/core';
import { ACTION_ICONS } from '@/config/icon-config';
import { formatDate } from '@/lib/utils-client';
import { useMessages } from '@/lib/hooks/use-messages';
import { CONTAINER_HEIGHTS } from '@/config';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👀'];

const ReactionBubble = memo(({ emoji, count, onClick, isUserReacted }) => (
  <ActionIcon
    size="xs"
    variant={isUserReacted ? 'filled' : 'light'}
    color={isUserReacted ? 'blue' : 'gray'}
    onClick={onClick}
    style={{ fontSize: '12px', padding: '2px 6px', height: 'auto' }}
  >
    {emoji} {count > 0 && count}
  </ActionIcon>
));

const MessageItem = memo(({ msg, user, formatTime, onReact }) => {
  const [showReactions, setShowReactions] = useState(false);
  const reactions = msg.reactions || {};
  const reactionList = Object.entries(reactions).map(([emoji, users]) => ({ emoji, count: users.length, users }));

  return (
    <Group key={msg.id} gap="sm" align="flex-start" style={{ flexDirection: msg.created_by === user?.id ? 'row-reverse' : 'row' }}>
      <Avatar src={msg.created_by_display?.avatar} size="sm" radius="xl">{msg.created_by_display?.name?.[0] || '?'}</Avatar>
      <Box maw="70%">
        <Group gap="xs" mb={4} style={{ justifyContent: msg.created_by === user?.id ? 'flex-end' : 'flex-start' }}>
          <Text size="xs" c="dimmed">{msg.created_by_display?.name || 'Unknown'}</Text>
          <Text size="xs" c="dimmed">{formatTime(msg.created_at)}</Text>
          {msg.is_team_only && <Group gap={4}><ACTION_ICONS.lock size={12} color="orange" /><Text size="xs" c="orange">Team only</Text></Group>}
        </Group>
        <Paper p="sm" bg={msg.created_by === user?.id ? 'blue' : 'gray.1'} c={msg.created_by === user?.id ? 'white' : undefined} radius="md">
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
        </Paper>
        {reactionList.length > 0 && (
          <Group gap="xs" mt={6}>
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
        <Group gap="xs" mt={4}>
          <Popover position="bottom" withArrow>
            <Popover.Target>
              <ActionIcon size="xs" variant="subtle" onClick={() => setShowReactions(!showReactions)}>
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
      </Box>
    </Group>
  );
});

function ChatPanelComponent({ entityType, entityId, user }) {
  const { messages, loading, sendMessage, refetch } = useMessages(entityType, entityId);
  const [isTeamOnly, setIsTeamOnly] = useState(false);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const formatTime = (ts) => formatDate(ts, 'datetime') || '';

  const handleSend = useCallback(async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const mentions = extractMentions(content);
      await sendMessage(content.trim(), { is_team_only: isTeamOnly, mentions });
      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }, [content, isTeamOnly, sendMessage]);

  const handleReact = useCallback(async (messageId, emoji) => {
    try {
      await fetch(`/api/message/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
      await refetch();
    } catch (err) {
      console.error('Failed to add reaction:', err);
    }
  }, [refetch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper p="md" withBorder>
      <Title order={4} mb="md">Chat</Title>
      <Stack h={CONTAINER_HEIGHTS.chat}>
        <ScrollArea flex={1}>
          {messages.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">No messages yet. Start the conversation!</Text>
          ) : (
            <Stack gap="md">
              {messages.map((msg) => (
                <MessageItem key={msg.id} msg={msg} user={user} formatTime={formatTime} onReact={handleReact} />
              ))}
            </Stack>
          )}
        </ScrollArea>
        <Group align="flex-end">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... Use @name to mention"
            style={{ flex: 1 }}
            rows={2}
            disabled={sending}
          />
          <ActionIcon onClick={handleSend} size="lg" loading={sending} disabled={!content.trim() || sending}>
            <ACTION_ICONS.send size={18} />
          </ActionIcon>
        </Group>
        {user?.type === 'auditor' && (
          <Checkbox label="Team members only" checked={isTeamOnly} onChange={(e) => setIsTeamOnly(e.currentTarget.checked)} mt="xs" />
        )}
      </Stack>
    </Paper>
  );
}

function extractMentions(text) {
  const mentions = [];
  const regex = /@(\w+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)];
}

export const ChatPanel = memo(ChatPanelComponent);
