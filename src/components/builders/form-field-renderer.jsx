'use client';

import { TextInput, Textarea, Select, Checkbox, NumberInput, Stack, Avatar } from '@mantine/core';
import { secondsToDate, dateToSeconds } from '@/lib/field-types';

export function renderFormField(field, values, setField, enumSelectData, refSelectData) {
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

    case 'enum':
      return (
        <Select
          name={field.key}
          value={val ? String(val) : null}
          onChange={(v) => setField(field.key, v)}
          data={enumSelectData[field.key] || []}
          placeholder={`Select ${field.label}`}
          clearable
          required={field.required}
        />
      );

    case 'ref':
      return (
        <Select
          name={field.key}
          value={val || null}
          onChange={(v) => setField(field.key, v)}
          data={refSelectData[field.key] || []}
          placeholder={`Select ${field.label}`}
          searchable
          clearable
          required={field.required}
        />
      );

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
}
