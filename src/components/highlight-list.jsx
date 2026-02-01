'use client';

import { useState, useMemo, useCallback } from 'react';
import { Paper, Group, Text, ActionIcon, Box, Badge, Stack, Button, Menu, SegmentedControl, Textarea } from '@mantine/core';
import { UI_ICONS, NAVIGATION_ICONS, ACTION_ICONS } from '@/config/icon-config';

const CATEGORY_COLORS = {
  important: 'red',
  question: 'blue',
  issue: 'orange'
};

const HIGHLIGHT_COLORS = {
  yellow: '#FFC107',
  orange: '#FF9800',
  pink: '#E91E63',
  green: '#4CAF50',
  blue: '#2196F3',
  grey: '#9E9E9E'
};

export function HighlightList({
  highlights = [],
  onSelectHighlight,
  selectedHighlightId,
  onResolveHighlight,
  onReopenHighlight,
  onDeleteHighlight,
  onExport,
  readOnly = false
}) {
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const filteredHighlights = useMemo(() => {
    let filtered = [...highlights];
    
    if (filterCategory) {
      filtered = filtered.filter(h => h.category === filterCategory);
    }
    
    if (filterStatus) {
      filtered = filtered.filter(h => h.status === filterStatus);
    }
    
    return filtered.sort((a, b) => b.created_at - a.created_at);
  }, [highlights, filterCategory, filterStatus]);

  const handleResolve = useCallback(async (highlightId) => {
    if (onResolveHighlight) {
      await onResolveHighlight(highlightId, resolutionNotes);
      setResolvingId(null);
      setResolutionNotes('');
    }
  }, [onResolveHighlight, resolutionNotes]);

  const handleReopen = useCallback(async (highlightId) => {
    if (onReopenHighlight) {
      await onReopenHighlight(highlightId);
    }
  }, [onReopenHighlight]);

  const handleDelete = useCallback(async (highlightId) => {
    if (confirm('Are you sure you want to delete this highlight?')) {
      if (onDeleteHighlight) {
        await onDeleteHighlight(highlightId);
      }
    }
  }, [onDeleteHighlight]);

  const stats = useMemo(() => ({
    total: highlights.length,
    resolved: highlights.filter(h => h.status === 'resolved').length,
    unresolved: highlights.filter(h => h.status === 'unresolved').length,
    byCategory: {
      important: highlights.filter(h => h.category === 'important').length,
      question: highlights.filter(h => h.category === 'question').length,
      issue: highlights.filter(h => h.category === 'issue').length
    }
  }), [highlights]);

  return (
    <Paper withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Stack gap={0} h="100%">
        <Group p="xs" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Group gap="xs">
            <Text size="sm" fw={500}>Highlights ({filteredHighlights.length})</Text>
            <Badge size="sm" variant="light">{stats.total}</Badge>
          </Group>
          {onExport && (
            <Menu>
              <Menu.Target>
                <ActionIcon variant="subtle" size="sm">
                  <UI_ICONS.download size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => onExport('json')}>Export as JSON</Menu.Item>
                <Menu.Item onClick={() => onExport('csv')}>Export as CSV</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        <Group p="xs" gap="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <SegmentedControl
            size="xs"
            value={filterStatus || ''}
            onChange={(val) => setFilterStatus(val || null)}
            data={[
              { label: 'All', value: '' },
              { label: `Unresolved (${stats.unresolved})`, value: 'unresolved' },
              { label: `Resolved (${stats.resolved})`, value: 'resolved' }
            ]}
          />
        </Group>

        <Box p="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Group gap="xs">
            <Badge
              size="sm"
              variant={filterCategory === 'important' ? 'filled' : 'outline'}
              color={CATEGORY_COLORS.important}
              style={{ cursor: 'pointer' }}
              onClick={() => setFilterCategory(filterCategory === 'important' ? null : 'important')}
            >
              Important ({stats.byCategory.important})
            </Badge>
            <Badge
              size="sm"
              variant={filterCategory === 'question' ? 'filled' : 'outline'}
              color={CATEGORY_COLORS.question}
              style={{ cursor: 'pointer' }}
              onClick={() => setFilterCategory(filterCategory === 'question' ? null : 'question')}
            >
              Question ({stats.byCategory.question})
            </Badge>
            <Badge
              size="sm"
              variant={filterCategory === 'issue' ? 'filled' : 'outline'}
              color={CATEGORY_COLORS.issue}
              style={{ cursor: 'pointer' }}
              onClick={() => setFilterCategory(filterCategory === 'issue' ? null : 'issue')}
            >
              Issue ({stats.byCategory.issue})
            </Badge>
          </Group>
        </Box>

        <Box flex={1} style={{ overflowY: 'auto' }}>
          {filteredHighlights.length === 0 ? (
            <Box p="md" ta="center">
              <Text size="sm" c="dimmed">No highlights found</Text>
            </Box>
          ) : (
            <Stack gap="xs" p="xs">
              {filteredHighlights.map((highlight) => (
                <Box
                  key={highlight.id}
                  p="sm"
                  style={{
                    backgroundColor: selectedHighlightId === highlight.id ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-gray-0)',
                    borderLeft: `4px solid ${HIGHLIGHT_COLORS[highlight.color] || '#999'}`,
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                  onClick={() => onSelectHighlight?.(highlight.id)}
                >
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <Badge size="xs" variant="light" color={CATEGORY_COLORS[highlight.category]}>
                        {highlight.category}
                      </Badge>
                      <Badge
                        size="xs"
                        variant="light"
                        color={highlight.status === 'resolved' ? 'green' : 'yellow'}
                      >
                        {highlight.status}
                      </Badge>
                    </Group>
                    {!readOnly && (
                      <Group gap={0}>
                        {highlight.status === 'unresolved' ? (
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResolvingId(highlight.id);
                            }}
                            title="Resolve highlight"
                          >
                            <UI_ICONS.check size={14} />
                          </ActionIcon>
                        ) : (
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReopen(highlight.id);
                            }}
                            title="Reopen highlight"
                          >
                            <NAVIGATION_ICONS.chevronLeft size={14} />
                          </ActionIcon>
                        )}
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(highlight.id);
                          }}
                          color="red"
                          title="Delete highlight"
                        >
                          <ACTION_ICONS.delete size={14} />
                        </ActionIcon>
                      </Group>
                    )}
                  </Group>

                  {highlight.text && (
                    <Text size="xs" mb="xs" style={{ fontStyle: 'italic', color: 'var(--mantine-color-gray-7)' }}>
                      "{highlight.text.substring(0, 80)}{highlight.text.length > 80 ? '...' : ''}"
                    </Text>
                  )}

                  {highlight.status === 'resolved' && highlight.resolution_notes && (
                    <Box p="xs" bg="green.0" style={{ borderRadius: '3px', marginTop: '6px' }}>
                      <Text size="xs" fw={500} c="green.9">Resolution:</Text>
                      <Text size="xs" c="green.8">{highlight.resolution_notes}</Text>
                    </Box>
                  )}

                  {resolvingId === highlight.id && (
                    <Box mt="xs" p="xs" bg="yellow.0" style={{ borderRadius: '3px' }}>
                      <Textarea
                        size="xs"
                        placeholder="Add resolution notes..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.currentTarget.value)}
                        mb="xs"
                        minRows={2}
                      />
                      <Group gap="xs">
                        <Button
                          size="xs"
                          onClick={() => handleResolve(highlight.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          onClick={() => {
                            setResolvingId(null);
                            setResolutionNotes('');
                          }}
                        >
                          Cancel
                        </Button>
                      </Group>
                    </Box>
                  )}

                  <Text size="xs" c="dimmed" mt="xs">
                    {new Date(highlight.created_at * 1000).toLocaleDateString()}
                  </Text>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
