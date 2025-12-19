'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Box, Button, Group, Text, Title } from '@mantine/core';
import { useFormState } from '@/lib/hooks';
import { buildFormFields } from '@/config';
import { renderFormField } from '@/lib/rendering-engine';
import { useFormStatus } from 'react-dom';
import { ListBuilder } from '@/components/builders/list-builder';
import { serverCreateEntity, serverUpdateEntity } from '@/lib/action-factory';
import { showNotification } from './notification-helpers';
import { FormSections } from '@/components/form-sections';

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
      const errorMessages = Object.entries(errors)
        .filter(([, msg]) => msg)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join('; ');
      showNotification.error(errorMessages || 'Please fix all errors before submitting', 'Validation Error');
      console.error('[FORM] Validation errors');
      return;
    }
    try {
      const name = entityName || spec.name;
      if (data.id) {
        await serverUpdateEntity(name, data.id, values);
        showNotification.success(`${spec.label} updated successfully`);
      } else {
        await serverCreateEntity(name, values);
        showNotification.success(`${spec.label} created successfully`);
      }
      router.push(`/${name}`);
    } catch (err) {
      console.error('[FORM] Submission error:', err);
      showNotification.error(err.message || 'Failed to submit form');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box maw={600}>
        <Group gap="xs" mb="lg">
          <Title order={2}>{data.id ? `Edit ${spec.label}` : `New ${spec.label}`}</Title>
        </Group>
        <FormSections
          sections={formSections}
          formFields={formFields}
          renderField={renderField}
          errors={errors}
        />
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
