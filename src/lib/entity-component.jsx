'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Box, Button, Group, Paper, Stack, Text, Title, Badge, Table, TextInput, Pagination, Select, ActionIcon, Menu } from '@mantine/core';
import { useSearch, useSort, useSelection, useFormState } from '@/lib/hooks';
import { buildFormFields, buildListColumns } from '@/config';
import { renderFormField, renderCellValue } from '@/lib/rendering-engine';
import { filterByQuery, groupByField, sortGroups } from '@/lib/list-data-transform';
import { useFormStatus } from 'react-dom';
import { Search, Plus, ChevronDown, ChevronRight, Edit2, Trash2, MoreVertical } from 'lucide-react';
import * as Icons from 'lucide-react';

function SubmitButton({ label, isSubmitting }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending || isSubmitting}>{label}</Button>;
}

function ListMode({ spec, data, pagination, onPageChange, onPageSizeChange, onCreateClick, canCreate }) {
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
        {Array.isArray(transformed) ? (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {columns.map(col => (
                  <Table.Th key={col.key} style={{ cursor: 'pointer' }} onClick={() => setSortField(col.key)}>
                    <Group gap="xs" justify="space-between">
                      <span>{col.label}</span>
                      {sortField === col.key && <Badge size="sm">{sortDir === 'asc' ? '↑' : '↓'}</Badge>}
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {transformed.map((row, i) => (
                <Table.Tr key={row.id || i} onClick={() => handleRowClick(row)} style={{ cursor: 'pointer' }}>
                  {columns.map(col => (
                    <Table.Td key={col.key}>{renderCellValue(row[col.key], col)}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          Object.entries(transformed).map(([groupKey, items]) => (
            <div key={groupKey}>
              <div
                onClick={() => toggleGroup(groupKey)}
                style={{
                  padding: 12,
                  background: 'var(--mantine-color-gray-1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderBottom: '1px solid var(--mantine-color-gray-3)',
                }}
              >
                {expandedGroups.includes(groupKey) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Text fw={500}>{groupKey}</Text>
                <Badge size="sm" ml="auto">{items.length}</Badge>
              </div>
              {expandedGroups.includes(groupKey) && (
                <Table striped>
                  <Table.Tbody>
                    {items.map((row, i) => (
                      <Table.Tr key={row.id || i} onClick={() => handleRowClick(row)} style={{ cursor: 'pointer' }}>
                        {columns.map(col => (
                          <Table.Td key={col.key}>{renderCellValue(row[col.key], col)}</Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </div>
          ))
        )}
      </div>

      {pagination && (
        <Group justify="space-between" align="center">
          <Pagination
            value={pagination.page}
            onChange={onPageChange}
            total={pagination.pages}
          />
          <Select
            value={String(pagination.pageSize)}
            onChange={(v) => onPageSizeChange?.(parseInt(v))}
            data={['10', '20', '50', '100'].map(v => ({ value: v, label: `${v} rows` }))}
            w={120}
          />
        </Group>
      )}
    </Stack>
  );
}

function FormMode({ spec, data = {}, options = {}, onSubmit, sections = null }) {
  const router = useRouter();
  const { values, setValue, errors, setError, hasErrors } = useFormState(spec, data);
  const formFields = useMemo(() => buildFormFields(spec), [spec]);
  const formSections = useMemo(() => sections || spec.form?.sections || [{ label: 'Details', fields: formFields.map(f => f.key) }], [sections, spec, formFields]);

  const enumSelectData = useMemo(() => {
    const data = {};
    for (const field of formFields) {
      if (field.type === 'enum' && field.options) {
        const enumOptions = spec.options?.[field.options] || [];
        data[field.key] = enumOptions.map(o => ({ value: String(o.value), label: o.label }));
      }
    }
    return data;
  }, [spec, formFields]);

  const refSelectData = useMemo(() => {
    const data = {};
    for (const field of formFields) {
      if (field.type === 'ref') {
        const refOptions = options[field.key] || [];
        data[field.key] = refOptions.map(o => ({ value: o.value, label: o.label }));
      }
    }
    return data;
  }, [options, formFields]);

  const renderField = (field) => renderFormField(field, values, setValue, enumSelectData, refSelectData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasErrors) {
      console.error('[FORM] Validation errors');
      return;
    }
    if (onSubmit) {
      try {
        await onSubmit(values);
      } catch (err) {
        console.error('[FORM] Submission error:', err);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box maw={600}>
        <Group gap="xs" mb="lg">
          <Title order={2}>{data.id ? `Edit ${spec.label}` : `New ${spec.label}`}</Title>
        </Group>
        <Stack gap="md">
          {formSections.map((section, i) => {
            const sectionFields = section.fields
              .map(fk => formFields.find(f => f.key === fk))
              .filter(Boolean);

            if (!sectionFields.length) return null;

            return (
              <Paper key={i} p="md" withBorder>
                {section.label && <Title order={4} mb="md">{section.label}</Title>}
                <Stack gap="sm">
                  {sectionFields.map(field => (
                    <Box key={field.key}>
                      {field.type !== 'bool' && (
                        <Text size="sm" fw={500} mb={4}>
                          {field.label}
                          {field.required && <Text span c="red" ml={4}>*</Text>}
                        </Text>
                      )}
                      {renderField(field)}
                      {errors[field.key] && <Text size="xs" c="red" mt={4}>{errors[field.key]}</Text>}
                    </Box>
                  ))}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
        <Group justify="flex-end" mt="lg">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <SubmitButton label={data.id ? 'Update' : 'Create'} />
        </Group>
      </Box>
    </form>
  );
}

export function Entity({ spec, data, mode = 'list', options = {}, pagination = null, onPageChange, onPageSizeChange, onCreateClick, onSubmit, canCreate = true, sections = null }) {
  if (mode === 'list') {
    return <ListMode spec={spec} data={data || []} pagination={pagination} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} onCreateClick={onCreateClick} canCreate={canCreate} />;
  }

  if (mode === 'form' || mode === 'edit' || mode === 'create') {
    return <FormMode spec={spec} data={data} options={options} onSubmit={onSubmit} sections={sections} />;
  }

  return <Text c="red">Unknown mode: {mode}</Text>;
}
