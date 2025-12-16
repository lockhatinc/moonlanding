'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Table, Button, Group, Stack, Text, Badge, TextInput, Pagination, Select } from '@mantine/core';
import { useSearch, useSort, useSelection } from '@/lib/hooks';
import { buildListColumns } from '@/config';
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { renderCellValue } from './list-cell-renderer';
import { filterByQuery, groupByField, sortGroups } from '@/lib/list-data-transform';

export function ListBuilder({
  spec,
  data = [],
  onCreateClick,
  canCreate = true,
  pagination = null,
  onPageChange = null,
  onPageSizeChange = null,
}) {
  const router = useRouter();
  const { query, setQuery } = useSearch();
  const { selected: expandedGroups, toggle: toggleGroup } = useSelection([], true);
  const { field: sortField, dir: sortDir, setSortField } = useSort(spec.list?.defaultSort?.field);

  const columns = useMemo(() => buildListColumns(spec), [spec]);
  const Icon = Icons[spec.icon] || Icons.File;
  const groupBy = spec.list?.groupBy;

  const transformed = useMemo(() => {
    const filtered = filterByQuery(data, query);
    const grouped = groupByField(filtered, groupBy);
    const sorted = sortGroups(grouped, sortField, sortDir);
    return sorted;
  }, [data, query, groupBy, sortField, sortDir]);

  const handleRowClick = (row) => router.push(`/${spec.name}/${row.id}`);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(newPage));
    router.push(`${window.location.pathname}?${params.toString()}`);
    onPageChange?.(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    const params = new URLSearchParams(window.location.search);
    params.set('pageSize', String(newPageSize));
    params.set('page', '1');
    router.push(`${window.location.pathname}?${params.toString()}`);
    onPageSizeChange?.(newPageSize);
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
        <TextInput
          placeholder={`Search ${spec.labelPlural.toLowerCase()}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      <div style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8, overflow: 'hidden' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {groupBy && <Table.Th style={{ width: 40 }} />}
              {columns.map(col => (
                <Table.Th
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
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Object.entries(transformed).map(([group, rows], idx) => (
              <div key={`group-${idx}-${group}`}>
                {groupBy && (
                  <Table.Tr
                    style={{ backgroundColor: 'var(--mantine-color-gray-1)', cursor: 'pointer' }}
                    onClick={() => toggleGroup(group)}
                  >
                    <Table.Td style={{ width: 40 }}>
                      {expandedGroups.includes(group) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </Table.Td>
                    <Table.Td colSpan={columns.length}>
                      <Group gap="xs">
                        <Text fw={500}>{group}</Text>
                        <Badge>{rows.length}</Badge>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                )}
                {(!groupBy || expandedGroups.includes(group)) &&
                  rows.map(row => (
                    <Table.Tr
                      key={row.id}
                      style={{
                        cursor: 'pointer',
                      }}
                      onClick={() => handleRowClick(row)}
                    >
                      {groupBy && <Table.Td style={{ width: 40 }} />}
                      {columns.map(col => (
                        <Table.Td key={col.key}>
                          {renderCellValue(row[col.key], col, spec, row)}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
              </div>
            ))}
            {data.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={columns.length + (groupBy ? 1 : 0)} style={{ textAlign: 'center', padding: 32, color: 'var(--mantine-color-gray-6)' }}>
                  No {spec.labelPlural.toLowerCase()} found
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </div>

      {pagination && (
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Showing {pagination.page * pagination.pageSize - pagination.pageSize + 1}-
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total}
            </Text>
            <Select
              placeholder="Page size"
              value={String(pagination.pageSize)}
              onChange={(value) => handlePageSizeChange(parseInt(value))}
              data={[
                { value: '10', label: '10 per page' },
                { value: '20', label: '20 per page' },
                { value: '50', label: '50 per page' },
                { value: '100', label: '100 per page' },
              ]}
              style={{ width: 140 }}
            />
          </Group>

          <Pagination
            value={pagination.page}
            onChange={handlePageChange}
            total={pagination.totalPages}
            siblings={1}
            boundaries={1}
          />
        </Group>
      )}
    </Stack>
  );
}
