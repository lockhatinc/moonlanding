'use client';

import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Button, Paper, Title, Group, Stack, Text, Box } from '@mantine/core';
import { useFormState } from '@/lib/hooks';
import { buildFormFields } from '@/config';
import { renderFormField } from './form-field-renderer';

function SubmitButton({ label, isSubmitting }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending || isSubmitting}>{label}</Button>;
}

export function FormBuilder({ spec, data = {}, options = {}, onSubmit, sections = null }) {
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
      console.error('Form has errors');
      return;
    }

    if (onSubmit) {
      try {
        await onSubmit(values);
      } catch (err) {
        console.error('Form submission error:', err);
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
