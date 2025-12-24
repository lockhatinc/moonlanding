'use client';

import { useState, memo } from 'react';
import { Stack, Paper, Box, Group, Badge, Text, ActionIcon, Avatar, Textarea, Button } from '@mantine/core';
import { UI_ICONS, NAVIGATION_ICONS, ACTION_ICONS } from '@/config/icon-config';
import { formatDate } from '@/lib/utils-client';
import { getColorMapping } from '@/config/theme-config';

const HighlightItem = memo(({ h, expandedId, setExpandedId, onSelect, onResolve, onReopen, onAddResponse, canResolve, formatTime, newResponse, setNewResponse, resolutionNotes, setResolutionNotes }) => {
  const handleSubmitResponse = () => {
    if (!newResponse.trim()) return;
    onAddResponse?.(h.id, newResponse);
    setNewResponse('');
  };

  const handleResolve = () => {
    if (!resolutionNotes.trim()) return;
    onResolve?.(h.id, resolutionNotes);
    setResolutionNotes('');
  };

  const isResolved = h.status === 'resolved';
  const statusColor = isResolved ? 'green' : h.is_high_priority ? 'red' : 'gray';

  return (
    <Box style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px', padding: '12px', opacity: h.archived ? 0.5 : 1 }}>
      <Group justify="space-between" align="flex-start" onClick={() => onSelect?.(h.id)} style={{ cursor: 'pointer' }}>
        <Box flex={1}>
          <Group gap="xs" mb={4}>
            <Badge size="sm">Page {h.page_number}</Badge>
            <Badge size="sm" color={statusColor}>{isResolved ? 'Resolved' : 'Unresolved'}</Badge>
            {h.is_high_priority && !isResolved && <Badge size="sm" color="red">High Priority</Badge>}
            {h.archived && <Badge size="sm" color="gray">Archived</Badge>}
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
          {isResolved && h.resolution_notes && (
            <Box style={{ padding: '8px', backgroundColor: 'var(--mantine-color-green-1)', marginBottom: '12px', borderRadius: '4px', border: '1px solid var(--mantine-color-green-3)' }}>
              <Text size="xs" fw={500} c="green" mb={4}>Resolution Notes</Text>
              <Text size="sm">{h.resolution_notes}</Text>
              <Text size="xs" c="dimmed" mt={4}>{h.resolved_by_display} • {formatTime(h.resolved_at)}</Text>
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
          {!isResolved && (
            <Group gap="xs" mb="xs">
              <Textarea value={newResponse} onChange={(e) => setNewResponse(e.target.value)} placeholder="Add a response..." style={{ flex: 1 }} rows={2} />
              <ActionIcon onClick={handleSubmitResponse} disabled={!newResponse.trim()}>
                <ACTION_ICONS.send size={16} />
              </ActionIcon>
            </Group>
          )}
          {canResolve && !isResolved && !h.archived && (
            <>
              <Textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="Resolution notes (required)..." mb="xs" rows={2} />
              <Button variant="outline" size="xs" fullWidth onClick={handleResolve} disabled={!resolutionNotes.trim()} leftSection={<UI_ICONS.check size={14} />}>
                Mark as Resolved
              </Button>
            </>
          )}
          {canResolve && isResolved && !h.archived && (
            <Button variant="outline" size="xs" fullWidth color="orange" onClick={() => onReopen?.(h.id)} leftSection={<ACTION_ICONS.reopen size={14} />}>
              Reopen Highlight
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
});

function HighlightLayerComponent({ highlights = [], selectedId, onSelect, onResolve, onReopen, onAddResponse, user, canResolve = false }) {
  const [expandedId, setExpandedId] = useState(null);
  const [newResponse, setNewResponse] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
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
          onReopen={onReopen}
          onAddResponse={onAddResponse}
          canResolve={canResolve}
          formatTime={formatTime}
          newResponse={newResponse}
          setNewResponse={setNewResponse}
          resolutionNotes={resolutionNotes}
          setResolutionNotes={setResolutionNotes}
        />
      ))}
    </Stack>
  );
}

export const HighlightLayer = memo(HighlightLayerComponent);
