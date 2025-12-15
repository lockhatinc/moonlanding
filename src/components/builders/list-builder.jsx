'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@mantine/core';
import { Input, Button, Group, Stack, Text, Badge, Avatar } from '@mantine/core';
import { useSelectionState, useSearchState, useSortState } from '@/lib/use-entity-state';
import { buildListColumns, formatDisplayText } from '@/config';
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';

export function ListBuilder({ spec, data = [], onCreateClick, canCreate = true }) {
  const router = useRouter();
  const { query, setQuery, clear, hasQuery } = useSearchState();
  const { selected, expanded, toggle, select, isSelected, isExpanded } = useSelectionState(null, false);
  const { field: sortField, dir: sortDir, setSortField } = useSortState(spec.list?.defaultSort?.field);

  const columns = useMemo(() => buildListColumns(spec), [spec]);
  const Icon = Icons[spec.icon] || Icons.File;

  const groupBy = spec.list?.groupBy;
  const grouped = useMemo(() => {
    let filtered = data;

    if (hasQuery) {
      const lowerQuery = query.toLowerCase();
      filtered = data.filter(row =>
        JSON.stringify(row).toLowerCase().includes(lowerQuery)
      );
    }

    if (!groupBy) return { '': filtered };

    return filtered.reduce((acc, row) => {
      const g = row[groupBy] || 'Other';
      (acc[g] = acc[g] || []).push(row);
      return acc;
    }, {});
  }, [data, groupBy, query, hasQuery]);

  const sorted = useMemo(() => {
    const result = {};
    for (const [group, rows] of Object.entries(grouped)) {
      if (!sortField) {
        result[group] = rows;
        continue;
      }

      result[group] = [...rows].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortDir === 'asc' ? 1 : -1;
        if (bVal == null) return sortDir === 'asc' ? -1 : 1;

        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [grouped, sortField, sortDir]);

  const toggleGroup = (g) => toggle(g);

  const handleRowClick = (row) => {
    router.push(`/${spec.name}/${row.id}`);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap="xs">
          <Icon size={24} />
          <Text fw={600} size="lg">{spec.labelPlural}</Text>
        </Group>
        {canCreate && (
          <Button onClick={onCreateClick || (() => router.push(`/${spec.name}/new`))}>
            <Plus size={16} style={{ marginRight: 8 }} />
            New {spec.label}
          </Button>
        )}
      </Group>

      <div style={{ position: 'relative', width: 288 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--mantine-color-gray-6)' }} />
        <Input
          placeholder={`Search ${spec.labelPlural.toLowerCase()}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      <div style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8, overflow: 'hidden' }}>
        <Table striped highlightOnHover>
          <TableHeader>
            <TableRow>
              {groupBy && <TableHead style={{ width: 40 }} />}
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
                  onClick={() => col.sortable && setSortField(col.key)}
                >
                  <Group gap="xs" justify="space-between">
                    <span>{col.label}</span>
                    {col.sortable && sortField === col.key && (
                      <span style={{ fontSize: 12 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Group>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(sorted).map(([group, rows]) => (
              <div key={group}>
                {groupBy && (
                  <TableRow
                    style={{ backgroundColor: 'var(--mantine-color-gray-1)', cursor: 'pointer' }}
                    onClick={() => toggleGroup(group)}
                  >
                    <TableCell style={{ width: 40 }}>
                      {isExpanded(group) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </TableCell>
                    <TableCell colSpan={columns.length}>
                      <Group gap="xs">
                        <Text fw={500}>{group}</Text>
                        <Badge>{rows.length}</Badge>
                      </Group>
                    </TableCell>
                  </TableRow>
                )}
                {(!groupBy || isExpanded(group)) &&
                  rows.map(row => (
                    <TableRow
                      key={row.id}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected(row.id) ? 'var(--mantine-color-blue-0)' : undefined,
                      }}
                      onClick={() => handleRowClick(row)}
                    >
                      {groupBy && <TableCell style={{ width: 40 }} />}
                      {columns.map(col => (
                        <TableCell key={col.key}>
                          {renderCellValue(row[col.key], col, spec, row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </div>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + (groupBy ? 1 : 0)} style={{ textAlign: 'center', padding: 32, color: 'var(--mantine-color-gray-6)' }}>
                  No {spec.labelPlural.toLowerCase()} found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Stack>
  );
}

function renderCellValue(value, col, spec, row) {
  if (value === null || value === undefined) return '—';

  const field = spec.fields[col.key];
  if (!field) return String(value);

  if (field.type === 'enum') {
    const options = spec.options?.[field.options] || [];
    const opt = options.find(o => o.value === value);
    if (!opt) return value;

    const colors = {
      green: { bg: '#d3f9d8', color: '#2f9e44' },
      yellow: { bg: '#fff3bf', color: '#f08c00' },
      amber: { bg: '#ffe066', color: '#d9480f' },
      blue: { bg: '#d0ebff', color: '#1971c2' },
      gray: { bg: '#f1f3f5', color: '#495057' },
      red: { bg: '#ffe0e0', color: '#c92a2a' },
    };

    const color = colors[opt.color] || colors.gray;
    return (
      <Badge style={{ backgroundColor: color.bg, color: color.color, border: 'none' }}>
        {opt.label}
      </Badge>
    );
  }

  if (field.type === 'bool') {
    return value ? '✓' : '—';
  }

  if (field.type === 'date' || field.type === 'timestamp') {
    if (!value) return '—';
    return new Date(value * 1000).toLocaleDateString();
  }

  if (field.type === 'image') {
    return (
      <Avatar src={value} size="sm">
        {row.name?.[0] || '?'}
      </Avatar>
    );
  }

  if (field.type === 'json') {
    return <code style={{ fontSize: 12 }}>{JSON.stringify(value).substring(0, 30)}</code>;
  }

  return String(value);
}
