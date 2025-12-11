'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Paper, Title, Avatar, Text, Group, Textarea, ActionIcon, Checkbox, Stack, Box, ScrollArea } from '@mantine/core';
import { Send, Lock } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <ActionIcon type="submit" size="lg" loading={pending}>
      <Send size={18} />
    </ActionIcon>
  );
}

export function ChatPanel({ entityType, entityId, messages = [], user, sendAction }) {
  const [isTeamOnly, setIsTeamOnly] = useState(false);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Paper p="md" withBorder>
      <Title order={4} mb="md">Chat</Title>
      <Stack h={400}>
        <ScrollArea flex={1}>
          {messages.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">No messages yet. Start the conversation!</Text>
          ) : (
            <Stack gap="md">
              {messages.map((msg) => (
                <Group key={msg.id} gap="sm" align="flex-start" style={{ flexDirection: msg.created_by === user?.id ? 'row-reverse' : 'row' }}>
                  <Avatar src={msg.created_by_display?.avatar} size="sm" radius="xl">
                    {msg.created_by_display?.name?.[0] || '?'}
                  </Avatar>
                  <Box maw="70%">
                    <Group gap="xs" mb={4} style={{ justifyContent: msg.created_by === user?.id ? 'flex-end' : 'flex-start' }}>
                      <Text size="xs" c="dimmed">{msg.created_by_display?.name || 'Unknown'}</Text>
                      <Text size="xs" c="dimmed">{formatTime(msg.created_at)}</Text>
                      {msg.is_team_only && (
                        <Group gap={4}>
                          <Lock size={12} color="orange" />
                          <Text size="xs" c="orange">Team only</Text>
                        </Group>
                      )}
                    </Group>
                    <Paper p="sm" bg={msg.created_by === user?.id ? 'blue' : 'gray.1'} c={msg.created_by === user?.id ? 'white' : undefined} radius="md">
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                    </Paper>
                  </Box>
                </Group>
              ))}
            </Stack>
          )}
        </ScrollArea>

        <form action={sendAction}>
          <input type="hidden" name="entity_type" value={entityType} />
          <input type="hidden" name="entity_id" value={entityId} />
          <input type="hidden" name="is_team_only" value={isTeamOnly ? 'true' : 'false'} />
          <Group align="flex-end">
            <Textarea name="content" placeholder="Type your message..." style={{ flex: 1 }} rows={2} />
            <SubmitButton />
          </Group>
          {user?.type === 'auditor' && (
            <Checkbox label="Team members only" checked={isTeamOnly} onChange={(e) => setIsTeamOnly(e.currentTarget.checked)} mt="xs" />
          )}
        </form>
      </Stack>
    </Paper>
  );
}
