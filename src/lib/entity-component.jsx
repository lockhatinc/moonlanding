'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Box, Button, Group, Text, Title, Loader } from '@mantine/core';
import { useFormState } from '@/lib/hooks';
import { useNavigation } from '@/lib/hooks';
import { buildFormFields, LOG_PREFIXES, SUCCESS_MESSAGES } from '@/config';
import { renderFormField } from '@/lib/rendering-engine';
import { useFormStatus } from 'react-dom';
import { serverCreateEntity, serverUpdateEntity } from '@/lib/action-factory';
import { showNotification } from './notification-helpers';
import { FormSections } from '@/components/form-sections';
import { ErrorBoundary } from '@/lib/error-boundary';

const ListBuilder = dynamic(() => import('@/components/builders/list-builder').then(m => ({ default: m.ListBuilder })), { loading: () => <Loader />, ssr: false });

function SubmitButton({ label, isSubmitting }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending || isSubmitting}>{label}</Button>;
}

function FormMode({ spec, data = {}, options = {}, entityName = null, sections = null }) {
  const { goBack, router } = useNavigation(entityName || spec.name);
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
      console.error(`${LOG_PREFIXES.validation} Validation errors`);
      return;
    }
    try {
      const name = entityName || spec.name;
      if (data.id) {
        await serverUpdateEntity(name, data.id, values);
        showNotification.success(SUCCESS_MESSAGES.updated(spec.label));
      } else {
        await serverCreateEntity(name, values);
        showNotification.success(SUCCESS_MESSAGES.created(spec.label));
      }
      router.push(`/${name}`);
    } catch (err) {
      console.error(`${LOG_PREFIXES.validation} Submission error:`, err);
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
          <Button variant="outline" onClick={goBack}>Cancel</Button>
          <SubmitButton label={data.id ? 'Update' : 'Create'} />
        </Group>
      </Box>
    </form>
  );
}

export function Entity({ spec, data, mode = 'list', options = {}, pagination = null, onPageChange, onPageSizeChange, onCreateClick, entityName = null, canCreate = true, sections = null }) {
  return (
    <ErrorBoundary>
      {mode === 'list' && (
        <ListBuilder spec={spec} data={data || []} pagination={pagination} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} onCreateClick={onCreateClick} canCreate={canCreate} />
      )}
      {(mode === 'form' || mode === 'edit' || mode === 'create') && (
        <FormMode spec={spec} data={data} options={options} entityName={entityName} sections={sections} />
      )}
      {!['list', 'form', 'edit', 'create'].includes(mode) && (
        <Text c="red">Unknown mode: {mode}</Text>
      )}
    </ErrorBoundary>
  );
}
