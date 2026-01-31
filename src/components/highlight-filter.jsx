'use client';

import { useState, useEffect } from 'react';
import { Group, Button, MultiSelect, Checkbox, Stack, Paper, Text, Badge, Card } from '@mantine/core';
import { Filter, X } from 'lucide-react';

export function HighlightFilter({ reviewId, onFiltersChange, highlights = [] }) {
  const [filters, setFilters] = useState({
    colors: [],
    statuses: [],
    pages: [],
    priorities: [],
    hasNotes: false,
    searchText: ''
  });

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const colorOptions = ['grey', 'green', 'red', 'purple'].map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }));
  const statusOptions = [{ value: 'unresolved', label: 'Unresolved' }, { value: 'resolved', label: 'Resolved' }];

  const pageOptions = Array.from(new Set(highlights.map(h => h.page_number)))
    .sort((a, b) => a - b)
    .map(p => ({ value: String(p), label: `Page ${p}` }));

  const priorityOptions = [
    { value: 'high', label: 'High Priority' },
    { value: 'normal', label: 'Normal Priority' }
  ];

  useEffect(() => {
    loadSuggestions();
  }, [reviewId]);

  async function loadSuggestions() {
    try {
      setLoading(true);
      const res = await fetch(`/api/mwr/review/${reviewId}/highlight-suggestions`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(key, value) {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }

  function clearFilters() {
    const newFilters = {
      colors: [],
      statuses: [],
      pages: [],
      priorities: [],
      hasNotes: false,
      searchText: ''
    };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }

  const activeFilterCount = [
    filters.colors.length,
    filters.statuses.length,
    filters.pages.length,
    filters.priorities.length,
    filters.hasNotes ? 1 : 0,
    filters.searchText ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <Filter size={18} />
            <Text fw={500}>Filter Highlights</Text>
            {activeFilterCount > 0 && (
              <Badge>{activeFilterCount} active</Badge>
            )}
          </Group>
          {activeFilterCount > 0 && (
            <Button
              size="xs"
              variant="subtle"
              leftSection={<X size={14} />}
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}
        </Group>

        <MultiSelect
          label="Colors"
          placeholder="Select colors"
          data={colorOptions}
          value={filters.colors}
          onChange={v => handleFilterChange('colors', v)}
          clearable
          searchable
        />

        <MultiSelect
          label="Status"
          placeholder="Select status"
          data={statusOptions}
          value={filters.statuses}
          onChange={v => handleFilterChange('statuses', v)}
          clearable
        />

        <MultiSelect
          label="Pages"
          placeholder="Select pages"
          data={pageOptions}
          value={filters.pages}
          onChange={v => handleFilterChange('pages', v)}
          clearable
          searchable
        />

        <MultiSelect
          label="Priority"
          placeholder="Select priority"
          data={priorityOptions}
          value={filters.priorities}
          onChange={v => handleFilterChange('priorities', v)}
          clearable
        />

        <Checkbox
          label="Has Resolution Notes"
          checked={filters.hasNotes}
          onChange={e => handleFilterChange('hasNotes', e.currentTarget.checked)}
        />

        {suggestions.length > 0 && (
          <div>
            <Text size="sm" fw={500} mb="xs">AI Suggestions</Text>
            <Stack gap="xs">
              {suggestions.slice(0, 3).map((s, i) => (
                <Card key={i} size="xs" p="xs" style={{ backgroundColor: '#e7f5ff', cursor: 'pointer' }}>
                  <Group justify="space-between">
                    <Text size="xs">{s.message}</Text>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => {
                        if (s.action === 'filter_unresolved') {
                          handleFilterChange('statuses', ['unresolved']);
                        } else if (s.action === 'review_colors') {
                          loadSuggestions();
                        }
                      }}
                    >
                      Apply
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          </div>
        )}
      </Stack>
    </Paper>
  );
}
