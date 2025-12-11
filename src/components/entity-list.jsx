'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TextInput, Button, Group, Title, Text, Paper, Box } from '@mantine/core';
import { FieldRender } from './field-render';
import { getListFields, getEntityIcon } from '@/lib/field-types';
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';

export function EntityList({ spec, data, searchQuery = '', canCreate = false }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(new Set());
  const [sortField, setSortField] = useState(spec.list?.defaultSort?.field || null);
  const [sortDir, setSortDir] = useState(spec.list?.defaultSort?.dir || 'asc');
  const [search, setSearch] = useState(searchQuery);

  const listFields = useMemo(() => getListFields(spec), [spec]);
  const groupBy = spec.list?.groupBy;
  const Icon = getEntityIcon(spec);

  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortField], bVal = b[sortField];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      return (aVal < bVal ? -1 : 1) * (sortDir === 'asc' ? 1 : -1);
    });
  }, [data, sortField, sortDir]);

  const grouped = useMemo(() => {
    if (!groupBy) return { '': sortedData };
    return sortedData.reduce((acc, row) => {
      const g = row[groupBy] || 'Other';
      (acc[g] = acc[g] || []).push(row);
      return acc;
    }, {});
  }, [sortedData, groupBy]);

  const toggleGroup = (g) => setExpanded(prev => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n; });
  const handleSort = (field) => {
    if (!listFields.find(f => f.key === field)?.sortable) return;
    setSortField(field); setSortDir(sortField === field && sortDir === 'asc' ? 'desc' : 'asc');
  };
  const handleSearch = (e) => { e.preventDefault(); router.push(`/${spec.name}${search ? `?q=${encodeURIComponent(search)}` : ''}`); };

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Group gap="xs"><Icon size={24} /><Title order={2}>{spec.labelPlural}</Title></Group>
        {canCreate && <Button leftSection={<Plus size={16} />} onClick={() => router.push(`/${spec.name}/new`)}>New {spec.label}</Button>}
      </Group>
      <form onSubmit={handleSearch}>
        <TextInput placeholder={`Search ${spec.labelPlural.toLowerCase()}...`} leftSection={<Search size={16} />} value={search} onChange={(e) => setSearch(e.target.value)} w={300} mb="md" />
      </form>
      <Paper withBorder>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {groupBy && <Table.Th w={40} />}
              {listFields.map(f => (
                <Table.Th key={f.key} style={{ width: f.width, cursor: f.sortable ? 'pointer' : 'default' }} onClick={() => handleSort(f.key)}>
                  <Group gap={4}>{f.label}{f.sortable && sortField === f.key && <Text size="xs">{sortDir === 'asc' ? '\u2191' : '\u2193'}</Text>}</Group>
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Object.entries(grouped).map(([group, rows]) => (
              <GroupRows key={group} group={group} rows={rows} groupBy={groupBy} expanded={expanded} toggleGroup={toggleGroup} listFields={listFields} spec={spec} router={router} />
            ))}
            {!data.length && <Table.Tr><Table.Td colSpan={listFields.length + (groupBy ? 1 : 0)}><Text ta="center" py="xl" c="dimmed">No {spec.labelPlural.toLowerCase()} found</Text></Table.Td></Table.Tr>}
          </Table.Tbody>
        </Table>
      </Paper>
    </Box>
  );
}

function GroupRows({ group, rows, groupBy, expanded, toggleGroup, listFields, spec, router }) {
  const isExpanded = expanded.has(group);
  return (
    <>
      {groupBy && (
        <Table.Tr style={{ backgroundColor: 'var(--mantine-color-gray-0)', cursor: 'pointer' }} onClick={() => toggleGroup(group)}>
          <Table.Td>{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</Table.Td>
          <Table.Td colSpan={listFields.length}><Text fw={500}>{group}</Text><Text span c="dimmed" ml="xs">({rows.length})</Text></Table.Td>
        </Table.Tr>
      )}
      {(!groupBy || isExpanded) && rows.map(row => (
        <Table.Tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/${spec.name}/${row.id}`)}>
          {groupBy && <Table.Td />}
          {listFields.map(f => <Table.Td key={f.key}><FieldRender spec={spec} field={f} value={row[f.key]} row={row} /></Table.Td>)}
        </Table.Tr>
      ))}
    </>
  );
}
