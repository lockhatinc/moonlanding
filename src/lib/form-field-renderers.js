import { TextInput, Textarea, Select, Checkbox, NumberInput, Stack, Avatar } from '@mantine/core';
import { secondsToDate, dateToSeconds } from '@/lib/field-registry';

const createTextareaRenderer = (field, val, setField) => (
  <Textarea name={field.key} value={val} onChange={(e) => setField(field.key, e.target.value)} rows={3} required={field.required} />
);

const createDateRenderer = (field, val, setField) => (
  <input
    type="date"
    name={field.key}
    value={val ? secondsToDate(val).toISOString().split('T')[0] : ''}
    onChange={(e) => setField(field.key, e.target.value ? dateToSeconds(new Date(e.target.value)) : '')}
    required={field.required}
    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--mantine-color-gray-4)', borderRadius: 4 }}
  />
);

const createNumberRenderer = (field, val, setField, opts = {}) => (
  <NumberInput name={field.key} value={val} onChange={(v) => setField(field.key, v)} required={field.required} {...opts} />
);

const createCheckboxRenderer = (field, val, setField) => (
  <Checkbox name={field.key} label={field.label} checked={!!val} onChange={(e) => setField(field.key, e.currentTarget.checked)} />
);

const createSelectRenderer = (field, val, setField, data, opts = {}) => (
  <Select name={field.key} value={val ? String(val) : null} onChange={(v) => setField(field.key, v)} data={data || []} placeholder={`Select ${field.label}`} required={field.required} {...opts} />
);

const createRefRenderer = (field, val, setField, data) => (
  <Select name={field.key} value={val || null} onChange={(v) => setField(field.key, v)} data={data || []} placeholder={`Select ${field.label}`} searchable clearable required={field.required} />
);

const createEmailRenderer = (field, val, setField) => (
  <TextInput type="email" name={field.key} value={val} onChange={(e) => setField(field.key, e.target.value)} required={field.required} />
);

const createImageRenderer = (field, val, setField) => (
  <Stack gap="xs">
    <TextInput name={field.key} value={val} onChange={(e) => setField(field.key, e.target.value)} placeholder="Image URL" required={field.required} />
    {val && <Avatar src={val} size="lg" />}
  </Stack>
);

const createDefaultRenderer = (field, val, setField) => (
  <TextInput name={field.key} value={val} onChange={(e) => setField(field.key, e.target.value)} required={field.required} />
);

export const FORM_FIELD_RENDERERS = {
  textarea: createTextareaRenderer,
  date: createDateRenderer,
  int: (f, v, s) => createNumberRenderer(f, v, s),
  decimal: (f, v, s) => createNumberRenderer(f, v, s, { decimalScale: 2 }),
  bool: createCheckboxRenderer,
  enum: (f, v, s, data) => createSelectRenderer(f, v, s, data, { clearable: true }),
  ref: createRefRenderer,
  email: createEmailRenderer,
  image: createImageRenderer,
};

export function renderFormField(field, values, setField, enumSelectData, refSelectData) {
  const val = values[field.key] ?? '';
  const renderer = FORM_FIELD_RENDERERS[field.type] || createDefaultRenderer;

  if (field.type === 'enum') {
    return renderer(field, val, setField, enumSelectData[field.key]);
  }
  if (field.type === 'ref') {
    return renderer(field, val, setField, refSelectData[field.key]);
  }
  return renderer(field, val, setField);
}
