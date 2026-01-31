'use client';

import { useState, useCallback, memo } from 'react';
import { Paper, Stack, Group, Text, ActionIcon, Avatar, Textarea, Box, Button } from '@mantine/core';
import { ACTION_ICONS } from '@/config/icon-config';
import { formatDate } from '@/lib/utils-client';
import { mentionNotificationService } from '@/services/mention-notification.service';

const CommentItem = memo(({ comment, user, formatTime, onDelete }) => {
  const isMine = comment.author_id === user?.id;

  return (
    <Group gap="sm" align="flex-start" style={{ flexDirection: isMine ? 'row-reverse' : 'row' }}>
      <Avatar src={comment.author_display?.avatar} size="sm" radius="xl">
        {comment.author_display?.name?.[0] || '?'}
      </Avatar>
      <Box maw="85%">
        <Group gap="xs" mb={4} style={{ justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
          <Text size="xs" fw={500}>{comment.author_display?.name || 'Unknown'}</Text>
          <Text size="xs" c="dimmed">{formatTime(comment.created_at)}</Text>
          {isMine && (
            <ActionIcon size="xs" variant="subtle" color="red" onClick={() => onDelete?.(comment.id)}>
              <ACTION_ICONS.delete size={14} />
            </ActionIcon>
          )}
        </Group>
        <Paper p="sm" bg={isMine ? 'blue' : 'gray.1'} c={isMine ? 'white' : undefined} radius="md">
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {comment.text}
          </Text>
          {comment.mentions && comment.mentions.length > 0 && (
            <Text size="xs" c={isMine ? 'rgba(255,255,255,0.7)' : 'dimmed'} mt={6}>
              Mentions: {comment.mentions.join(', ')}
            </Text>
          )}
        </Paper>
      </Box>
    </Group>
  );
});

function CommentSectionComponent({ entityType, entityId, comments = [], user, onAddComment, onDeleteComment }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const formatTime = (ts) => formatDate(ts, 'datetime') || '';

  const handleSend = useCallback(async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const mentions = mentionNotificationService.extractMentions(content);
      await onAddComment?.({
        text: content.trim(),
        mentions,
        entity_type: entityType,
        entity_id: entityId
      });
      setContent('');
      await mentionNotificationService.processMentions(
        content.trim(),
        entityType,
        entityId,
        user?.id
      );
    } catch (error) {
      console.error('Failed to send comment:', error);
    } finally {
      setSending(false);
    }
  }, [content, entityType, entityId, user?.id, onAddComment]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper p="md" withBorder>
      <Text fw={500} size="sm" mb="md">Comments</Text>
      <Stack gap="md">
        {comments.length === 0 ? (
          <Text ta="center" c="dimmed" py="xl" size="sm">
            No comments yet. Start the discussion!
          </Text>
        ) : (
          <Stack gap="md">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                user={user}
                formatTime={formatTime}
                onDelete={onDeleteComment}
              />
            ))}
          </Stack>
        )}
        <Group align="flex-end" gap="xs">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment... Use @name to mention someone"
            style={{ flex: 1 }}
            rows={2}
            disabled={sending}
          />
          <ActionIcon onClick={handleSend} size="lg" loading={sending} disabled={!content.trim() || sending}>
            <ACTION_ICONS.send size={18} />
          </ActionIcon>
        </Group>
      </Stack>
    </Paper>
  );
}

export const CommentSection = memo(CommentSectionComponent);
