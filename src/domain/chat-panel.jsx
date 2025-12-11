'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Paper, Stack, Text, Group, Avatar, Textarea, Button, ActionIcon, ScrollArea, Badge, Divider, Box, Loader } from '@mantine/core';
import { Send, Paperclip, X, Reply, Lock, Image as ImageIcon, File } from 'lucide-react';

/**
 * Chat panel for engagement/review messaging
 */
export function ChatPanel({
  entityType,
  entityId,
  messages = [],
  currentUser,
  onSendMessage,
  onLoadMore,
  hasMore = false,
  loading = false,
  isTeamOnly = false,
  canToggleTeamOnly = false,
}) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [teamOnlyMode, setTeamOnlyMode] = useState(isTeamOnly);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length]);

  // Handle send message
  const handleSend = async () => {
    if (!content.trim() && attachments.length === 0) return;
    if (!onSendMessage) return;

    setSending(true);
    try {
      await onSendMessage({
        entity_type: entityType,
        entity_id: entityId,
        content: content.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
        is_team_only: teamOnlyMode,
        reply_to: replyTo?.id,
      });

      setContent('');
      setAttachments([]);
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages area */}
      <ScrollArea ref={scrollRef} style={{ flex: 1 }} p="md">
        {hasMore && (
          <Box ta="center" mb="md">
            <Button variant="subtle" size="sm" onClick={onLoadMore} loading={loading}>
              Load older messages
            </Button>
          </Box>
        )}

        {loading && messages.length === 0 ? (
          <Box ta="center" py="xl">
            <Loader size="md" />
          </Box>
        ) : messages.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No messages yet. Start the conversation!
          </Text>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <Box key={date}>
              <Divider
                label={formatDateLabel(date)}
                labelPosition="center"
                my="md"
              />
              <Stack gap="md">
                {msgs.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isOwn={message.created_by === currentUser?.id}
                    onReply={() => setReplyTo(message)}
                  />
                ))}
              </Stack>
            </Box>
          ))
        )}
      </ScrollArea>

      {/* Input area */}
      <Paper p="md" withBorder style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderBottom: 0 }}>
        {/* Reply preview */}
        {replyTo && (
          <Paper p="xs" mb="xs" bg="gray.0" withBorder>
            <Group justify="space-between">
              <Group gap="xs">
                <Reply size={14} />
                <Text size="xs" c="dimmed">
                  Replying to {replyTo.created_by_display || 'user'}
                </Text>
              </Group>
              <ActionIcon size="xs" variant="subtle" onClick={() => setReplyTo(null)}>
                <X size={14} />
              </ActionIcon>
            </Group>
            <Text size="sm" lineClamp={1}>
              {replyTo.content}
            </Text>
          </Paper>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <Group gap="xs" mb="xs">
            {attachments.map((att, index) => (
              <Paper key={index} p="xs" withBorder style={{ position: 'relative' }}>
                <ActionIcon
                  size="xs"
                  variant="filled"
                  color="red"
                  style={{ position: 'absolute', top: -8, right: -8 }}
                  onClick={() => removeAttachment(index)}
                >
                  <X size={12} />
                </ActionIcon>
                {att.preview ? (
                  <img src={att.preview} alt={att.name} style={{ height: 60, maxWidth: 100, objectFit: 'cover' }} />
                ) : (
                  <Group gap="xs">
                    <File size={16} />
                    <Text size="xs" lineClamp={1} style={{ maxWidth: 100 }}>
                      {att.name}
                    </Text>
                  </Group>
                )}
              </Paper>
            ))}
          </Group>
        )}

        {/* Team only toggle */}
        {canToggleTeamOnly && (
          <Group gap="xs" mb="xs">
            <Button
              size="xs"
              variant={teamOnlyMode ? 'filled' : 'light'}
              color={teamOnlyMode ? 'orange' : 'gray'}
              leftSection={<Lock size={14} />}
              onClick={() => setTeamOnlyMode(!teamOnlyMode)}
            >
              {teamOnlyMode ? 'Team Only' : 'Everyone'}
            </Button>
            {teamOnlyMode && (
              <Text size="xs" c="orange">
                This message will only be visible to team members
              </Text>
            )}
          </Group>
        )}

        {/* Input */}
        <Group gap="xs" align="flex-end">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            onChange={handleFileSelect}
          />
          <ActionIcon
            variant="subtle"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <Paperclip size={18} />
          </ActionIcon>

          <Textarea
            placeholder="Type a message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1 }}
            minRows={1}
            maxRows={5}
            autosize
            disabled={sending}
          />

          <ActionIcon
            variant="filled"
            color="blue"
            size="lg"
            onClick={handleSend}
            disabled={(!content.trim() && attachments.length === 0) || sending}
            loading={sending}
          >
            <Send size={18} />
          </ActionIcon>
        </Group>
      </Paper>
    </Box>
  );
}

/**
 * Individual message item
 */
function MessageItem({ message, isOwn, onReply }) {
  const time = message.created_at
    ? new Date(message.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        gap: 8,
      }}
    >
      <Avatar
        size="sm"
        src={message.created_by_avatar}
        radius="xl"
      >
        {(message.created_by_display || 'U')[0].toUpperCase()}
      </Avatar>

      <Paper
        p="sm"
        bg={isOwn ? 'blue.0' : 'gray.0'}
        style={{
          maxWidth: '70%',
          borderRadius: 12,
          borderTopLeftRadius: isOwn ? 12 : 4,
          borderTopRightRadius: isOwn ? 4 : 12,
        }}
      >
        <Group justify="space-between" mb={4}>
          <Text size="xs" fw={500}>
            {message.created_by_display || 'User'}
          </Text>
          <Group gap={4}>
            {message.is_team_only && (
              <Badge size="xs" color="orange" variant="light">
                <Lock size={10} /> Team
              </Badge>
            )}
            {message.source && message.source !== 'local' && (
              <Badge size="xs" color="gray" variant="light">
                {message.source}
              </Badge>
            )}
            <Text size="xs" c="dimmed">
              {time}
            </Text>
          </Group>
        </Group>

        {/* Reply reference */}
        {message.reply_to_content && (
          <Paper p="xs" mb="xs" bg="gray.1" withBorder style={{ borderLeft: '3px solid var(--mantine-color-blue-5)' }}>
            <Text size="xs" lineClamp={2} c="dimmed">
              {message.reply_to_content}
            </Text>
          </Paper>
        )}

        {/* Message content */}
        <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </Text>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <Stack gap="xs" mt="xs">
            {message.attachments.map((att, index) => (
              <AttachmentDisplay key={index} attachment={att} />
            ))}
          </Stack>
        )}

        {/* Actions */}
        <Group gap="xs" mt="xs">
          <ActionIcon size="xs" variant="subtle" onClick={onReply}>
            <Reply size={14} />
          </ActionIcon>
        </Group>
      </Paper>
    </Box>
  );
}

/**
 * Attachment display
 */
function AttachmentDisplay({ attachment }) {
  const isImage = attachment.type?.startsWith('image/') || attachment.file_type?.startsWith('image/');

  if (isImage) {
    return (
      <img
        src={attachment.url || attachment.download_url}
        alt={attachment.name || attachment.file_name}
        style={{
          maxWidth: '100%',
          maxHeight: 200,
          borderRadius: 8,
          cursor: 'pointer',
        }}
        onClick={() => window.open(attachment.url || attachment.download_url, '_blank')}
      />
    );
  }

  return (
    <Paper
      p="xs"
      withBorder
      component="a"
      href={attachment.url || attachment.download_url}
      target="_blank"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <Group gap="xs">
        <File size={16} />
        <Text size="sm">{attachment.name || attachment.file_name}</Text>
        {attachment.file_size && (
          <Text size="xs" c="dimmed">
            ({formatFileSize(attachment.file_size)})
          </Text>
        )}
      </Group>
    </Paper>
  );
}

// Utility functions
function groupMessagesByDate(messages) {
  return messages.reduce((groups, message) => {
    const date = message.created_at
      ? new Date(message.created_at * 1000).toDateString()
      : 'Unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});
}

function formatDateLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default ChatPanel;
