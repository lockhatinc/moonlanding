'use client';

import { useState, memo } from 'react';
import { Stack, Paper, Box, Group, Badge, Text, ActionIcon, Avatar, Textarea, Button } from '@mantine/core';
import { UI_ICONS, NAVIGATION_ICONS, ACTION_ICONS } from '@/config/icon-config';
import { formatDate } from '@/lib/utils-client';
import { getColorMapping } from '@/config/theme-config';

const HighlightItem = memo(({ h, expandedId, setExpandedId, onSelect, onResolve, onAddResponse, canResolve, formatTime, newResponse, setNewResponse }) => {
  const handleSubmitResponse = () => {
    if (!newResponse.trim()) return;
    onAddResponse?.(h.id, newResponse);
    setNewResponse('');
  };

  return (
    <Box style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px', padding: '12px' }}>
      <Group justify="space-between" align="flex-start" onClick={() => onSelect?.(h.id)} style={{ cursor: 'pointer' }}>
        <Box flex={1}>
          <Group gap="xs" mb={4}>
            <Badge size="sm">Page {h.page_number}</Badge>
            <Badge size="sm" color={getColorMapping('highlight_status', h.resolved ? 'resolved' : 'unresolved')}>{h.resolved ? 'Resolved' : 'Open'}</Badge>
          </Group>
          <Text size="sm" lineClamp={2}>{h.comment || h.content || 'No comment'}</Text>
        </Box>
        <ActionIcon variant="subtle" onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === h.id ? null : h.id); }}>
          {expandedId === h.id ? <NAVIGATION_ICONS.chevronUp size={16} /> : <NAVIGATION_ICONS.chevronDown size={16} />}
        </ActionIcon>
      </Group>
      {expandedId === h.id && (
        <Box style={{ marginTop: '12px' }}>
          <Group gap="xs" mb="xs">
            <Avatar size="xs">{h.created_by_display?.[0] || '?'}</Avatar>
            <Text size="xs" c="dimmed">{h.created_by_display || 'Unknown'} • {formatTime(h.created_at)}</Text>
          </Group>
          {h.content && (
            <Box style={{ padding: '8px', backgroundColor: 'var(--mantine-color-gray-1)', marginBottom: '12px', borderRadius: '4px' }}>
              <Text size="sm" fs="italic">"{h.content}"</Text>
            </Box>
          )}
          {h.responses?.length > 0 && (
            <Stack gap="xs" mb="sm">
              <Text size="xs" fw={500} c="dimmed">Responses</Text>
              {h.responses.map((r) => (
                <Box key={r.id} style={{ padding: '8px', backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '4px' }}>
                  <Text size="sm">{r.content}</Text>
                  <Text size="xs" c="dimmed">{r.created_by_display} • {formatTime(r.created_at)}</Text>
                </Box>
              ))}
            </Stack>
          )}
          <Group gap="xs" mb="xs">
            <Textarea value={newResponse} onChange={(e) => setNewResponse(e.target.value)} placeholder="Add a response..." style={{ flex: 1 }} rows={2} />
            <ActionIcon onClick={handleSubmitResponse} disabled={!newResponse.trim()}>
              <ACTION_ICONS.send size={16} />
            </ActionIcon>
          </Group>
          {canResolve && !h.resolved && (
            <Button variant="outline" size="xs" fullWidth onClick={(e) => onResolve?.(h.id)} leftSection={<UI_ICONS.check size={14} />}>
              Mark as Resolved
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
});

function HighlightLayerComponent({ highlights = [], selectedId, onSelect, onResolve, onAddResponse, user, canResolve = false }) {
  const [expandedId, setExpandedId] = useState(null);
  const [newResponse, setNewResponse] = useState('');
  const formatTime = (ts) => formatDate(ts, 'short') || '';

  return (
    <Stack gap="xs">
      {highlights.length === 0 ? (
        <Paper p="xl" withBorder>
          <Stack align="center" c="dimmed">
            <UI_ICONS.messageSquare size={32} opacity={0.5} />
            <Text>No queries yet</Text>
            <Text size="sm">Select an area on the PDF to add a query</Text>
          </Stack>
        </Paper>
      ) : highlights.map((h) => (
        <HighlightItem
          key={h.id}
          h={h}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onSelect={onSelect}
          onResolve={onResolve}
          onAddResponse={onAddResponse}
          canResolve={canResolve}
          formatTime={formatTime}
          newResponse={newResponse}
          setNewResponse={setNewResponse}
        />
      ))}
    </Stack>
  );
}

export const HighlightLayer = memo(HighlightLayerComponent);
