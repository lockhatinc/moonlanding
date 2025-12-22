'use client';

import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useMemo, useCallback } from 'react';
import { Button, Title, Group, Box } from '@mantine/core';
import { useFormState } from '@/lib/hooks';
import { buildFormFields } from '@/config';
import { renderFormField } from '@/lib/rendering-engine';
import { FormSections } from '@/components/form-sections';
import { showNotification } from '@/lib/notification-helpers';

function SubmitButton({ label, isSubmitting }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending || isSubmitting}>{label}</Button>;
}

export function FormBuilder({ spec, data = {}, options = {}, onSubmit, onSuccess, onError, sections = null }) {
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
      onError?.({ type: 'validation', errors });
      return;
    }

    if (onSubmit) {
      try {
        await onSubmit(values);
        showNotification.success(`${spec.label} ${data.id ? 'updated' : 'created'} successfully`);
        onSuccess?.({ values });
      } catch (err) {
        console.error('Form submission error:', err);
        showNotification.error(err.message || 'Failed to submit form');
        onError?.({ type: 'submission', error: err });
      }
    }
  };

  return (
    <form role="form" aria-labelledby="form-title" onSubmit={handleSubmit}>
      <Box maw={600}>
        <Group gap="xs" mb="lg">
          <Title order={2} id="form-title">{data.id ? `Edit ${spec.label}` : `New ${spec.label}`}</Title>
        </Group>
        <FormSections
          sections={formSections}
          formFields={formFields}
          renderField={renderField}
          errors={errors}
        />
        <Group justify="flex-end" mt="lg">
          <Button variant="outline" onClick={() => router.back()} aria-label="Cancel editing">Cancel</Button>
          <SubmitButton label={data.id ? 'Update' : 'Create'} isSubmitting={false} aria-label={data.id ? `Update ${spec.label}` : `Create ${spec.label}`} aria-disabled={hasErrors} />
        </Group>
      </Box>
    </form>
  );
}
