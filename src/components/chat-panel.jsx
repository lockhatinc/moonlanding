'use client';

import { useState, useCallback, memo } from 'react';
import { Paper, Stack, Group, Text, ActionIcon, Avatar, Textarea, Box, Title, ScrollArea, Checkbox } from '@mantine/core';
import { ACTION_ICONS } from '@/config/icon-config';
import { formatDate } from '@/lib/utils-client';
import { useApi } from '@/lib/api-client-unified';
import { CONTAINER_HEIGHTS } from '@/config';

const MessageItem = memo(({ msg, user, formatTime }) => (
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
    </Box>
  </Group>
));

function ChatPanelComponent({ entityType, entityId, messages = [], user, onSendMessage }) {
  const [displayMessages, setDisplayMessages] = useState(messages);
  const [isTeamOnly, setIsTeamOnly] = useState(false);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const { execute } = useApi();
  const formatTime = (ts) => formatDate(ts, 'datetime') || '';

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await execute(api => api.list('chat', { entity_type: entityType, entity_id: entityId }));
      setDisplayMessages(msgs);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  }, [execute, entityType, entityId]);

  const handleSend = useCallback(async () => {
    if (!content.trim() || !onSendMessage) return;
    setSending(true);
    try {
      await onSendMessage({
        entity_type: entityType,
        entity_id: entityId,
        content: content.trim(),
        is_team_only: isTeamOnly,
      });
      setContent('');
      await loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }, [content, entityType, entityId, isTeamOnly, loadMessages, onSendMessage]);

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
          {displayMessages.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">No messages yet. Start the conversation!</Text>
          ) : (
            <Stack gap="md">
              {displayMessages.map((msg) => <MessageItem key={msg.id} msg={msg} user={user} formatTime={formatTime} />)}
            </Stack>
          )}
        </ScrollArea>
        <Group align="flex-end">
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your message..." style={{ flex: 1 }} rows={2} disabled={sending} />
          <ActionIcon onClick={handleSend} size="lg" loading={sending} disabled={!content.trim() || sending}><ACTION_ICONS.send size={18} /></ActionIcon>
        </Group>
        {user?.type === 'auditor' && <Checkbox label="Team members only" checked={isTeamOnly} onChange={(e) => setIsTeamOnly(e.currentTarget.checked)} mt="xs" />}
      </Stack>
    </Paper>
  );
}

export const ChatPanel = memo(ChatPanelComponent);
