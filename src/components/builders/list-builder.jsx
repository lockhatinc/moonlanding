'use client';

import { useMemo, memo, useCallback } from 'react';
import { Table, Button, Group, Stack, Text, Badge, TextInput, Pagination, Select } from '@mantine/core';
import { useSelection } from '@/lib/hooks';
import { useBuilderState } from '@/lib/builder-hooks';
import { buildListColumns, LAYOUT, TABLE_DEFAULTS, TABLE_PAGINATION_DEFAULTS } from '@/config';
import { Icons, UI_ICONS, NAVIGATION_ICONS, ACTION_ICONS } from '@/config/icon-config';
import { renderCellValue } from '@/lib/rendering-engine';
import { filterByQuery, groupByField, sortGroups } from '@/lib/list-data-transform';
import { SkeletonTable } from '@/components/skeleton';
import { EmptyState, NoSearchResults } from '@/components/empty-state';

const TableRow = memo(function TableRow({ row, columns, spec, groupBy, onRowClick }) {
  const isPriority = row._isPriority === true;

  return (
    <Table.Tr
      style={{ cursor: 'pointer', backgroundColor: isPriority ? 'var(--mantine-color-yellow-0)' : undefined }}
      onClick={() => onRowClick(row)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${row.title || row.name || row.id}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRowClick(row);
        }
      }}
    >
      {groupBy && <Table.Td style={{ width: 40 }} />}
      {columns.map((col, idx) => (
        <Table.Td key={col.key}>
          {idx === 0 && isPriority && (
            <Group gap={4} wrap="nowrap">
              <UI_ICONS.star size={14} style={{ color: 'var(--mantine-color-yellow-6)', flexShrink: 0 }} />
              {renderCellValue(row[col.key], col, spec, row)}
            </Group>
          )}
          {(idx !== 0 || !isPriority) && renderCellValue(row[col.key], col, spec, row)}
        </Table.Td>
      ))}
    </Table.Tr>
  );
});

export function ListBuilder({
  spec,
  data = [],
  onCreateClick,
  canCreate = true,
  pagination = null,
  onPageChange = null,
  onPageSizeChange = null,
  loading = false,
}) {
  const { pagination: paginationState, sort, search, handlers, setLoading } = useBuilderState(spec, 'list');
  const { selected: expandedGroups, toggle: toggleGroup } = useSelection([], true);

  const columns = useMemo(() => buildListColumns(spec), [spec]);
  const Icon = Icons[spec.icon] || Icons.file;
  const groupBy = spec.list?.groupBy;

  const transformed = useMemo(() => {
    const filtered = filterByQuery(data, search.query);
    const grouped = groupByField(filtered, groupBy);
    const sorted = sortGroups(grouped, sort.field, sort.dir);
    return sorted;
  }, [data, search.query, groupBy, sort.field, sort.dir]);

  const handleRowClick = useCallback((row) => {
    if (globalThis.__builderRouter) {
      globalThis.__builderRouter.push(`/${spec.name}/${row.id}`);
    } else {
      window.location.href = `/${spec.name}/${row.id}`;
    }
  }, [spec.name]);

  const handleCreateClick = useCallback(() => {
    if (onCreateClick) {
      onCreateClick();
    } else if (globalThis.__builderRouter) {
      globalThis.__builderRouter.push(`/${spec.name}/new`);
    } else {
      window.location.href = `/${spec.name}/new`;
    }
  }, [onCreateClick, spec.name]);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap="xs">
          <Icon size={24} />
          <Text fw={600} size="lg">{spec.labelPlural}</Text>
        </Group>
        {canCreate && (
          <Button onClick={handleCreateClick} disabled={loading} aria-label={`Create new ${spec.label}`}>
            <ACTION_ICONS.create size={16} style={{ marginRight: 8 }} aria-hidden="true" />
            New {spec.label}
          </Button>
        )}
      </Group>
      <div style={{ position: 'relative', width: LAYOUT.searchWidth }}>
        <UI_ICONS.search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--mantine-color-gray-6)' }} aria-hidden="true" />
        <TextInput
          placeholder={`Search ${spec.labelPlural.toLowerCase()}...`}
          value={search.query}
          onChange={(e) => handlers.queryChange(e.target.value)}
          style={{ paddingLeft: 40 }}
          disabled={loading}
          role="searchbox"
          aria-label={`Search ${spec.labelPlural}`}
          aria-controls="results-table"
          aria-busy={loading}
        />
      </div>

      {loading ? (
        <SkeletonTable rowCount={TABLE_DEFAULTS.skeleton.rowCount} columnCount={columns.length + (groupBy ? 1 : 0)} />
      ) : data.length === 0 && search.query ? (
        <NoSearchResults query={search.query} />
      ) : data.length === 0 ? (
        <EmptyState
          title={`No ${spec.labelPlural.toLowerCase()} yet`}
          message={`Create your first ${spec.label.toLowerCase()} to get started`}
          icon={Icons[spec.icon] || Icons.file}
          action={canCreate}
          actionLabel={`New ${spec.label}`}
          actionHref={`/${spec.name}/new`}
        />
      ) : (
        <div style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: TABLE_DEFAULTS.borderRadius, overflow: 'hidden' }}>
          <Table striped highlightOnHover id="results-table">
            <Table.Thead>
              <Table.Tr>
                {groupBy && <Table.Th style={{ width: 40 }} />}
                {columns.map(col => (
                  <Table.Th
                    key={col.key}
                    style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
                    onClick={() => col.sortable && handlers.sort(col.key)}
                    role={col.sortable ? 'button' : undefined}
                    aria-sort={col.sortable ? (sort.field === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                    aria-label={col.sortable ? `Sort by ${col.label}` : undefined}
                    tabIndex={col.sortable ? 0 : undefined}
                    onKeyDown={col.sortable ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlers.sort(col.key);
                      }
                    } : undefined}
                  >
                    <Group gap="xs" justify="space-between">
                      <span>{col.label}</span>
                      {col.sortable && sort.field === col.key && (
                        <span style={{ fontSize: 12 }} aria-hidden="true">{sort.dir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Object.entries(transformed).map(([group, rows], idx) => [
                groupBy && (
                  <Table.Tr
                    key={`group-${idx}-${group}`}
                    style={{ backgroundColor: 'var(--mantine-color-gray-1)', cursor: 'pointer' }}
                    onClick={() => toggleGroup(group)}
                    role="button"
                    aria-expanded={expandedGroups.includes(group)}
                    aria-controls={`group-${idx}-content`}
                    aria-label={`${expandedGroups.includes(group) ? 'Collapse' : 'Expand'} ${group} group`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleGroup(group);
                      }
                    }}
                  >
                    <Table.Td style={{ width: 40 }}>
                      {expandedGroups.includes(group) ? (
                        <NAVIGATION_ICONS.chevronDown size={16} aria-hidden="true" />
                      ) : (
                        <NAVIGATION_ICONS.chevronRight size={16} aria-hidden="true" />
                      )}
                    </Table.Td>
                    <Table.Td colSpan={columns.length}>
                      <Group gap="xs">
                        <Text fw={500}>{group}</Text>
                        <Badge>{rows.length}</Badge>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ),
                (!groupBy || expandedGroups.includes(group)) &&
                  rows.map(row => (
                    <TableRow
                      key={row.id}
                      row={row}
                      columns={columns}
                      spec={spec}
                      groupBy={groupBy}
                      onRowClick={handleRowClick}
                    />
                  )),
              ]).flat().filter(Boolean)}
            </Table.Tbody>
          </Table>
        </div>
      )}
      {pagination && (
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="sm" c="dimmed" role="status" aria-live="polite">
              Showing {pagination.page * pagination.pageSize - pagination.pageSize + 1}-
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total}
            </Text>
            <Select
              placeholder="Page size"
              value={String(pagination.pageSize)}
              onChange={(value) => onPageSizeChange ? onPageSizeChange(parseInt(value)) : handlers.pageSizeChange(parseInt(value))}
              data={(spec.list?.pageSizeOptions || [10, 20, 50, 100]).map((size) => ({
                value: String(size),
                label: `${size} per page`,
              }))}
              style={{ width: TABLE_PAGINATION_DEFAULTS.selectWidth }}
              aria-label="Items per page"
              aria-controls="results-table"
            />
          </Group>

          <Pagination
            value={pagination.page}
            onChange={onPageChange || handlers.pageChange}
            total={pagination.totalPages}
            siblings={1}
            boundaries={1}
            aria-label="Pagination navigation"
          />
        </Group>
      )}
    </Stack>
  );
}
