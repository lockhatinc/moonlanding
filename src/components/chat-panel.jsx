'use client';

import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { Paper, Stack, Group, Text, ActionIcon, Textarea, Box, Title, ScrollArea, Button } from '@mantine/core';
import { ACTION_ICONS } from '@/config/icon-config';
import { CONTAINER_HEIGHTS } from '@/config';
import { MessageItem } from '@/components/message-item';

function ChatPanelComponent({ entityType, entityId, user }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const pollIntervalRef = useRef(null);

  const rfiId = entityId;

  const fetchMessages = useCallback(async () => {
    if (!rfiId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/message?rfi_id=${rfiId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data.data || data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setLoading(false);
    }
  }, [rfiId]);

  useEffect(() => {
    fetchMessages();
    pollIntervalRef.current = setInterval(fetchMessages, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [rfiId, fetchMessages]);

  const handleSend = useCallback(async () => {
    if (!content.trim()) return;

    setSending(true);
    try {
      const mentions = extractMentions(content);
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfi_id: rfiId,
          content: content.trim(),
          mentions,
          attachments: []
        })
      });

      if (!res.ok) throw new Error('Failed to send message');

      setContent('');
      await fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }, [content, rfiId, fetchMessages]);

  const handleReact = useCallback(async (messageId, emoji) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const reactions = message.reactions || {};
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }

      const userIndex = (reactions[emoji] || []).indexOf(user.id);
      if (userIndex > -1) {
        reactions[emoji].splice(userIndex, 1);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        reactions[emoji].push(user.id);
      }

      const updatedMessages = messages.map(m =>
        m.id === messageId ? { ...m, reactions } : m
      );
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Failed to react:', error);
    }
  }, [messages, user.id]);

  const handleEdit = useCallback(async (msg) => {
    if (editingId === msg.id) {
      if (!editContent.trim()) {
        setEditingId(null);
        setEditContent('');
        return;
      }

      try {
        const res = await fetch(`/api/message/${msg.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editContent.trim() })
        });

        if (!res.ok) throw new Error('Failed to update message');

        setEditingId(null);
        setEditContent('');
        await fetchMessages();
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    } else {
      setEditingId(msg.id);
      setEditContent(msg.content);
    }
  }, [editingId, editContent, fetchMessages]);

  const handleDelete = useCallback(async (messageId) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      const res = await fetch(`/api/message/${messageId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete message');
      await fetchMessages();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }, [fetchMessages]);

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
        <ScrollArea flex={1} type="auto">
          {loading ? (
            <Text ta="center" c="dimmed" py="xl">Loading messages...</Text>
          ) : messages.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">No messages yet. Start the conversation!</Text>
          ) : (
            <Stack gap="md" pr="md">
              {messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  msg={msg}
                  user={user}
                  onReact={handleReact}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isEditing={editingId === msg.id}
                  editContent={editContent}
                  onEditChange={setEditContent}
                />
              ))}
            </Stack>
          )}
        </ScrollArea>

        <Group align="flex-end" gap="sm">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... Use @name to mention"
            style={{ flex: 1 }}
            rows={2}
            disabled={sending || loading}
          />
          <ActionIcon
            onClick={handleSend}
            size="lg"
            loading={sending}
            disabled={!content.trim() || sending}
            color="blue"
          >
            <ACTION_ICONS.send size={18} />
          </ActionIcon>
        </Group>
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
