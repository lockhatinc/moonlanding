'use client';

import { useState } from 'react';
import { Paper, Stack, Group, Badge, Text, ActionIcon, Button, Avatar, Textarea, Box, Collapse } from '@mantine/core';
import { MessageSquare, Check, Send, ChevronDown, ChevronUp } from 'lucide-react';

export function HighlightLayer({ highlights = [], selectedId, onSelect, onResolve, onAddResponse, user, canResolve = false }) {
  const [expandedId, setExpandedId] = useState(null);
  const [newResponse, setNewResponse] = useState('');

  const handleToggleExpand = (id) => setExpandedId(expandedId === id ? null : id);
  const handleSubmitResponse = (highlightId) => {
    if (!newResponse.trim()) return;
    onAddResponse?.(highlightId, newResponse);
    setNewResponse('');
  };
  const formatTime = (timestamp) => timestamp ? new Date(timestamp * 1000).toLocaleDateString() : '';

  return (
    <Stack gap="xs">
      {highlights.length === 0 ? (
        <Paper p="xl" withBorder>
          <Stack align="center" c="dimmed">
            <MessageSquare size={32} opacity={0.5} />
            <Text>No queries yet</Text>
            <Text size="sm">Select an area on the PDF to add a query</Text>
          </Stack>
        </Paper>
      ) : (
        highlights.map((highlight) => (
          <Paper key={highlight.id} p="sm" withBorder style={{ cursor: 'pointer', outline: selectedId === highlight.id ? '2px solid var(--mantine-color-blue-6)' : 'none' }} onClick={() => onSelect?.(highlight.id)}>
            <Group justify="space-between" align="flex-start">
              <Box flex={1}>
                <Group gap="xs" mb={4}>
                  <Badge size="sm">Page {highlight.page_number}</Badge>
                  <Badge size="sm" color={highlight.resolved ? 'green' : 'yellow'}>{highlight.resolved ? 'Resolved' : 'Open'}</Badge>
                </Group>
                <Text size="sm" lineClamp={2}>{highlight.comment || highlight.content || 'No comment'}</Text>
              </Box>
              <ActionIcon variant="subtle" onClick={(e) => { e.stopPropagation(); handleToggleExpand(highlight.id); }}>
                {expandedId === highlight.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </ActionIcon>
            </Group>

            <Collapse in={expandedId === highlight.id}>
              <Box mt="sm" onClick={(e) => e.stopPropagation()}>
                <Group gap="xs" mb="xs">
                  <Avatar size="xs">{highlight.created_by_display?.[0] || '?'}</Avatar>
                  <Text size="xs" c="dimmed">{highlight.created_by_display || 'Unknown'} • {formatTime(highlight.created_at)}</Text>
                </Group>
                {highlight.content && <Paper p="xs" bg="gray.1" mb="sm"><Text size="sm" fs="italic">"{highlight.content}"</Text></Paper>}
                {highlight.responses?.length > 0 && (
                  <Stack gap="xs" mb="sm">
                    <Text size="xs" fw={500} c="dimmed">Responses</Text>
                    {highlight.responses.map((r) => (
                      <Paper key={r.id} p="xs" bg="gray.0"><Text size="sm">{r.content}</Text><Text size="xs" c="dimmed">{r.created_by_display} • {formatTime(r.created_at)}</Text></Paper>
                    ))}
                  </Stack>
                )}
                <Group gap="xs" mb="xs">
                  <Textarea value={newResponse} onChange={(e) => setNewResponse(e.target.value)} placeholder="Add a response..." style={{ flex: 1 }} rows={2} />
                  <ActionIcon onClick={() => handleSubmitResponse(highlight.id)} disabled={!newResponse.trim()}><Send size={16} /></ActionIcon>
                </Group>
                {canResolve && !highlight.resolved && (
                  <Button variant="outline" size="xs" fullWidth leftSection={<Check size={14} />} onClick={() => onResolve?.(highlight.id)}>Mark as Resolved</Button>
                )}
              </Box>
            </Collapse>
          </Paper>
        ))
      )}
    </Stack>
  );
}
