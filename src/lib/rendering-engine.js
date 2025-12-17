import React from 'react';
import { TextInput, Textarea, Select, Checkbox, NumberInput, Stack, Avatar, Badge, Text, Image as MImage } from '@mantine/core';
import { secondsToDate, dateToSeconds, getBadgeStyle } from '@/lib/field-registry';

const FORM_FIELD_RENDERERS = {
  textarea: (f, v, s) => <Textarea name={f.key} value={v} onChange={(e) => s(f.key, e.target.value)} rows={3} required={f.required} />,
  date: (f, v, s) => <input type="date" name={f.key} value={v ? secondsToDate(v).toISOString().split('T')[0] : ''} onChange={(e) => s(f.key, e.target.value ? dateToSeconds(new Date(e.target.value)) : '')} required={f.required} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--mantine-color-gray-4)', borderRadius: 4 }} />,
  int: (f, v, s) => <NumberInput name={f.key} value={v} onChange={(x) => s(f.key, x)} required={f.required} step={1} />,
  decimal: (f, v, s) => <NumberInput name={f.key} value={v} onChange={(x) => s(f.key, x)} required={f.required} decimalScale={2} />,
  bool: (f, v, s) => <Checkbox name={f.key} label={f.label} checked={!!v} onChange={(e) => s(f.key, e.currentTarget.checked)} />,
  enum: (f, v, s, d) => <Select name={f.key} value={v ? String(v) : null} onChange={(x) => s(f.key, x)} data={d?.[f.key] || []} placeholder={`Select ${f.label}`} required={f.required} clearable />,
  ref: (f, v, s, d, r) => <Select name={f.key} value={v || null} onChange={(x) => s(f.key, x)} data={r?.[f.key] || []} placeholder={`Select ${f.label}`} searchable clearable required={f.required} />,
  email: (f, v, s) => <TextInput type="email" name={f.key} value={v} onChange={(e) => s(f.key, e.target.value)} required={f.required} />,
  image: (f, v, s) => <Stack gap="xs"><TextInput name={f.key} value={v} onChange={(e) => s(f.key, e.target.value)} placeholder="Image URL" required={f.required} />{v && <Avatar src={v} size="lg" />}</Stack>,
  text: (f, v, s) => <TextInput name={f.key} value={v} onChange={(e) => s(f.key, e.target.value)} required={f.required} />,
  json: (f, v, s) => <Textarea name={f.key} value={typeof v === 'string' ? v : JSON.stringify(v, null, 2)} onChange={(e) => s(f.key, e.target.value)} required={f.required} rows={5} />,
};

const LIST_RENDERERS = {
  enum: (v, f, spec) => !v ? '—' : <Badge style={{ backgroundColor: getBadgeStyle(spec.options?.[f.options]?.find(o => o.value === v)?.color)?.bg }}>{spec.options?.[f.options]?.find(o => o.value === v)?.label}</Badge>,
  bool: (v) => v ? '✓' : '—',
  date: (v) => !v ? '—' : secondsToDate(v).toLocaleDateString(),
  timestamp: (v) => !v ? '—' : secondsToDate(v).toLocaleDateString(),
  image: (v, f, s, r) => <Avatar src={v} size="sm">{r.name?.[0] || '?'}</Avatar>,
  json: (v) => <code style={{ fontSize: 12 }}>{JSON.stringify(v).substring(0, 30)}</code>,
  text: (v) => !v ? '—' : String(v),
  textarea: (v) => !v ? '—' : String(v).substring(0, 50),
  email: (v) => !v ? '—' : String(v),
  int: (v) => !v ? '—' : String(v),
  decimal: (v) => !v ? '—' : Number(v).toFixed(2),
  ref: (v) => !v ? '—' : String(v),
};

const DISPLAY_RENDERERS = {
  text: (v) => <Text size="sm" truncate>{v || '-'}</Text>,
  email: (v) => v ? <a href={`mailto:${v}`}><Text size="sm" color="blue">{v}</Text></a> : <Text size="sm">-</Text>,
  textarea: (v) => <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} truncate>{v || '-'}</Text>,
  int: (v) => <Text size="sm">{v || '-'}</Text>,
  decimal: (v) => <Text size="sm">{v ? Number(v).toFixed(2) : '-'}</Text>,
  date: (v) => <Text size="sm">{v ? secondsToDate(v).toLocaleDateString() : '-'}</Text>,
  timestamp: (v) => <Text size="sm">{v ? secondsToDate(v).toLocaleString() : '-'}</Text>,
  bool: (v) => <Badge color={v ? 'green' : 'gray'}>{v ? 'Yes' : 'No'}</Badge>,
  enum: (v, f, spec) => <Badge color={spec?.options?.[f.options]?.find(o => String(o.value) === String(v))?.color || 'gray'}>{spec?.options?.[f.options]?.find(o => String(o.value) === String(v))?.label || v}</Badge>,
  ref: (v) => <Text size="sm" truncate>{v || '-'}</Text>,
  image: (v) => v ? <MImage src={v} alt="img" height={40} width={40} fit="cover" /> : <Text size="sm">-</Text>,
  json: (v) => <Text size="xs" style={{ fontFamily: 'monospace' }} truncate>{typeof v === 'string' ? v : JSON.stringify(v)}</Text>,
};

const EDIT_RENDERERS = {
  text: (f, v, s) => <TextInput label={f.label} value={v || ''} onChange={(e) => s(e.target.value)} />,
  email: (f, v, s) => <TextInput label={f.label} type="email" value={v || ''} onChange={(e) => s(e.target.value)} />,
  textarea: (f, v, s) => <Textarea label={f.label} value={v || ''} onChange={(e) => s(e.target.value)} />,
  int: (f, v, s) => <NumberInput label={f.label} value={v} onChange={s} step={1} />,
  decimal: (f, v, s) => <NumberInput label={f.label} value={v} onChange={s} precision={2} />,
  date: (f, v, s) => <input type="date" value={v ? secondsToDate(v).toISOString().split('T')[0] : ''} onChange={(e) => s(e.target.value ? dateToSeconds(new Date(e.target.value)) : '')} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }} />,
  bool: (f, v, s) => <Checkbox label={f.label} checked={!!v} onChange={(e) => s(e.currentTarget.checked)} />,
  enum: (f, v, s, spec) => <Select label={f.label} data={spec?.options?.[f.options]?.map((op) => ({ label: op.label, value: String(op.value) })) || []} value={v ? String(v) : ''} onChange={s} searchable clearable />,
  ref: (f, v, s, spec) => <Select label={f.label} data={spec?.options?.[f.key]?.map((op) => ({ label: op.label || op.value, value: op.value })) || []} value={v ? String(v) : ''} onChange={s} searchable />,
  image: (f, v, s) => <TextInput label={f.label} type="file" accept="image/*" />,
  json: (f, v, s) => <Textarea label={f.label} value={typeof v === 'string' ? v : JSON.stringify(v, null, 2)} onChange={(e) => s(e.target.value)} />,
};

const RENDERERS = { form: FORM_FIELD_RENDERERS, list: LIST_RENDERERS, display: DISPLAY_RENDERERS, edit: EDIT_RENDERERS };

export function renderFormField(field, values, setField, enumData, refData) {
  const v = values[field.key] ?? '';
  const r = FORM_FIELD_RENDERERS[field.type] || FORM_FIELD_RENDERERS.text;
  try {
    if (field.type === 'enum') return r(field, v, setField, enumData);
    if (field.type === 'ref') return r(field, v, setField, enumData, refData);
    return r(field, v, setField);
  } catch (e) {
    console.error(`[Renderer] Form field error for ${field.key}:`, e);
    return <span>Error</span>;
  }
}

export function renderCellValue(value, column, spec, row) {
  const r = LIST_RENDERERS[column.type] || LIST_RENDERERS.text;
  try {
    return r(value, column, spec, row);
  } catch (e) {
    console.error(`[Renderer] List cell error for ${column.key}:`, e);
    return <span>—</span>;
  }
}

export function renderDisplayValue(value, field, spec) {
  const r = DISPLAY_RENDERERS[field.type] || DISPLAY_RENDERERS.text;
  try {
    return r(value, field, spec);
  } catch (e) {
    console.error(`[Renderer] Display error for ${field.key}:`, e);
    return <span>—</span>;
  }
}

export function renderEditField(field, value, setField, spec) {
  const r = EDIT_RENDERERS[field.type] || EDIT_RENDERERS.text;
  try {
    return r(field, value, setField, spec);
  } catch (e) {
    console.error(`[Renderer] Edit field error for ${field.key}:`, e);
    return <span>Error</span>;
  }
}

export class RenderingEngine {
  register(mode, fieldType, renderer) {
    if (RENDERERS[mode]) RENDERERS[mode][fieldType] = renderer;
  }
  getRenderer(mode, fieldType) {
    return RENDERERS[mode]?.[fieldType];
  }
}

export const renderingEngine = new RenderingEngine();
