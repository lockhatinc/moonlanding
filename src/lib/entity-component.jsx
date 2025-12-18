'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Box, Button, Group, Paper, Stack, Text, Title, Badge, Table, TextInput, Pagination, Select, ActionIcon, Menu } from '@mantine/core';
import { useSearch, useSort, useSelection, useFormState } from '@/lib/hooks';
import { buildFormFields, buildListColumns } from '@/config';
import { renderFormField, renderCellValue } from '@/lib/rendering-engine';
import { filterByQuery, groupByField, sortGroups } from '@/lib/list-data-transform';
import { useFormStatus } from 'react-dom';
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { ListBuilder } from '@/components/builders/list-builder';
import { serverCreateEntity, serverUpdateEntity } from '@/lib/action-factory';

function SubmitButton({ label, isSubmitting }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending || isSubmitting}>{label}</Button>;
}

function FormMode({ spec, data = {}, options = {}, entityName = null, sections = null }) {
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
    try {
      const name = entityName || spec.name;
      if (data.id) {
        await serverUpdateEntity(name, data.id, values);
      } else {
        await serverCreateEntity(name, values);
      }
      router.push(`/${name}`);
    } catch (err) {
      console.error('[FORM] Submission error:', err);
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

export function Entity({ spec, data, mode = 'list', options = {}, pagination = null, onPageChange, onPageSizeChange, onCreateClick, entityName = null, canCreate = true, sections = null }) {
  if (mode === 'list') {
    return <ListBuilder spec={spec} data={data || []} pagination={pagination} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} onCreateClick={onCreateClick} canCreate={canCreate} />;
  }

  if (mode === 'form' || mode === 'edit' || mode === 'create') {
    return <FormMode spec={spec} data={data} options={options} entityName={entityName} sections={sections} />;
  }

  return <Text c="red">Unknown mode: {mode}</Text>;
}
