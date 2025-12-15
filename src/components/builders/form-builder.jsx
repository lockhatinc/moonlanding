'use client';

import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button, TextInput, Textarea, Select, Checkbox, NumberInput, Paper, Title, Group, Stack, Text, Avatar, Box } from '@mantine/core';
import { useFormState } from '@/lib/use-entity-state';
import { buildFormFields } from '@/config';
import { secondsToDate, dateToSeconds } from '@/lib/field-types';

function SubmitButton({ label, isSubmitting }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending || isSubmitting}>{label}</Button>;
}

export function FormBuilder({ spec, data = {}, options = {}, onSubmit, sections = null }) {
  const router = useRouter();
  const { values, setField, errors, setError, isValid } = useFormState(data);
  const formFields = buildFormFields(spec);
  const formSections = sections || spec.form?.sections || [{ label: 'Details', fields: formFields.map(f => f.key) }];

  const renderField = (field) => {
    const val = values[field.key] ?? '';

    switch (field.type) {
      case 'textarea':
        return <Textarea name={field.key} value={val} onChange={(e) => setField(field.key, e.target.value)} rows={3} required={field.required} />;

      case 'date':
        return (
          <input
            type="date"
            name={field.key}
            value={val ? secondsToDate(val).toISOString().split('T')[0] : ''}
            onChange={(e) => setField(field.key, e.target.value ? dateToSeconds(new Date(e.target.value)) : '')}
            required={field.required}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--mantine-color-gray-4)', borderRadius: 4 }}
          />
        );

      case 'int':
        return (
          <NumberInput
            name={field.key}
            value={val}
            onChange={(v) => setField(field.key, v)}
            required={field.required}
          />
        );

      case 'decimal':
        return (
          <NumberInput
            name={field.key}
            value={val}
            onChange={(v) => setField(field.key, v)}
            decimalScale={2}
            required={field.required}
          />
        );

      case 'bool':
        return (
          <Checkbox
            name={field.key}
            label={field.label}
            checked={!!val}
            onChange={(e) => setField(field.key, e.currentTarget.checked)}
          />
        );

      case 'enum': {
        const enumOptions = spec.options?.[field.options] || [];
        return (
          <Select
            name={field.key}
            value={val ? String(val) : null}
            onChange={(v) => setField(field.key, v)}
            data={enumOptions.map(o => ({ value: String(o.value), label: o.label }))}
            placeholder={`Select ${field.label}`}
            clearable
            required={field.required}
          />
        );
      }

      case 'ref': {
        const refOptions = options[field.key] || [];
        return (
          <Select
            name={field.key}
            value={val || null}
            onChange={(v) => setField(field.key, v)}
            data={refOptions.map(o => ({ value: o.value, label: o.label }))}
            placeholder={`Select ${field.label}`}
            searchable
            clearable
            required={field.required}
          />
        );
      }

      case 'email':
        return (
          <TextInput
            type="email"
            name={field.key}
            value={val}
            onChange={(e) => setField(field.key, e.target.value)}
            required={field.required}
          />
        );

      case 'image':
        return (
          <Stack gap="xs">
            <TextInput
              name={field.key}
              value={val}
              onChange={(e) => setField(field.key, e.target.value)}
              placeholder="Image URL"
              required={field.required}
            />
            {val && <Avatar src={val} size="lg" />}
          </Stack>
        );

      default:
        return (
          <TextInput
            name={field.key}
            value={val}
            onChange={(e) => setField(field.key, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid()) {
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
