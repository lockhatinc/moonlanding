import React from 'react';
import { TextInput, Textarea, Select, Checkbox, NumberInput, Avatar, Badge, Text, Image as MImage, Tooltip } from '@mantine/core';
import { fieldRegistry } from './field-types';
import { secondsToDate, dateToSeconds, getBadgeStyle } from '@/lib/utils-client';
import { showNotification } from './notification-helpers';

const FORM_FIELD_RENDERERS = {
  textarea: (f, v, s) => <Textarea name={f.key} value={v} onChange={(e) => s(f.key, e.target.value)} rows={3} required={f.required} />,
  date: (f, v, s) => <input type="date" name={f.key} value={v ? secondsToDate(v).toISOString().split('T')[0] : ''} onChange={(e) => s(f.key, e.target.value ? dateToSeconds(new Date(e.target.value)) : '')} required={f.required} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--mantine-color-gray-4)', borderRadius: 4 }} />,
  int: (f, v, s) => <NumberInput name={f.key} value={v} onChange={(x) => s(f.key, x)} required={f.required} step={1} />,
  decimal: (f, v, s) => <NumberInput name={f.key} value={v} onChange={(x) => s(f.key, x)} required={f.required} decimalScale={2} />,
  bool: (f, v, s) => <Checkbox name={f.key} label={f.label} checked={!!v} onChange={(e) => s(f.key, e.currentTarget.checked)} />,
  text: (f, v, s) => <TextInput name={f.key} value={v} onChange={(e) => s(f.key, e.target.value)} required={f.required} />,
  email: (f, v, s) => <TextInput name={f.key} type="email" value={v} onChange={(e) => s(f.key, e.target.value)} required={f.required} />,
  enum: (f, v, s, en) => <Select name={f.key} value={v} data={en?.[f.options]?.map(o => ({ value: String(o.value), label: o.label })) || []} onChange={(val) => s(f.key, val)} required={f.required} />,
  ref: (f, v, s, en, rd) => <Select name={f.key} value={v} data={rd?.[f.ref]?.map(o => ({ value: o.id, label: o.name })) || []} onChange={(val) => s(f.key, val)} required={f.required} />,
  json: (f, v, s) => <Textarea name={f.key} value={typeof v === 'string' ? v : JSON.stringify(v || {})} onChange={(e) => s(f.key, e.target.value)} rows={4} required={f.required} />,
  image: (f, v, s) => <TextInput name={f.key} value={v} onChange={(e) => s(f.key, e.target.value)} placeholder="Image URL" />,
};

const LIST_RENDERERS = {
  textarea: (v) => <Text truncate>{v}</Text>,
  json: (v) => <Text truncate size="xs">{typeof v === 'string' ? v : JSON.stringify(v)}</Text>,
  bool: (v) => v ? '✓' : '—',
  date: (v) => v ? secondsToDate(v).toLocaleDateString() : '—',
  timestamp: (v) => v ? secondsToDate(v).toLocaleString() : '—',
  enum: (v, c, spec, row) => {
    const options = spec?.options?.[c.options];
    if (!options) return v;
    const opt = options.find(o => String(o.value) === String(v));
    return opt ? <Badge color={opt.color || 'gray'}>{opt.label}</Badge> : v;
  },
  ref: (v, c, spec, row) => {
    if (!c.display) return v;
    if (c.display === 'avatars' && Array.isArray(v)) return <Avatar.Group size="xs">{v.map(uid => <Avatar key={uid} src="" />)}</Avatar.Group>;
    return row?.[`${c.key}_display`] || v;
  },
  image: (v) => v ? <MImage src={v} height={40} width={40} /> : '—',
};

const DISPLAY_RENDERERS = {
  textarea: (v) => <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{v}</Text>,
  json: (v) => <Text size="xs" c="dimmed">{typeof v === 'string' ? v : JSON.stringify(v, null, 2)}</Text>,
  bool: (v) => v ? 'Yes' : 'No',
  date: (v) => v ? secondsToDate(v).toLocaleDateString() : '—',
  timestamp: (v) => v ? secondsToDate(v).toLocaleString() : '—',
  enum: (v, field, spec) => {
    const options = spec?.options?.[field.options];
    if (!options) return v;
    const opt = options.find(o => String(o.value) === String(v));
    return opt ? <Badge color={opt.color || 'gray'}>{opt.label}</Badge> : v;
  },
  ref: (v, field, spec) => spec?.entities?.[field.ref]?.name || v,
  image: (v) => v ? <MImage src={v} height={200} /> : '—',
};

const EDIT_RENDERERS = {
  textarea: (f, v, s) => <Textarea value={v} onChange={(e) => s(f.key, e.target.value)} rows={3} required={f.required} />,
  date: (f, v, s) => <input type="date" value={v ? secondsToDate(v).toISOString().split('T')[0] : ''} onChange={(e) => s(f.key, e.target.value ? dateToSeconds(new Date(e.target.value)) : '')} required={f.required} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--mantine-color-gray-4)', borderRadius: 4 }} />,
  int: (f, v, s) => <NumberInput value={v} onChange={(x) => s(f.key, x)} required={f.required} step={1} />,
  decimal: (f, v, s) => <NumberInput value={v} onChange={(x) => s(f.key, x)} required={f.required} decimalScale={2} />,
  bool: (f, v, s) => <Checkbox label={f.label} checked={!!v} onChange={(e) => s(f.key, e.currentTarget.checked)} />,
  text: (f, v, s) => <TextInput value={v} onChange={(e) => s(f.key, e.target.value)} required={f.required} />,
  email: (f, v, s) => <TextInput type="email" value={v} onChange={(e) => s(f.key, e.target.value)} required={f.required} />,
  enum: (f, v, s, en) => <Select value={v} data={en?.[f.options]?.map(o => ({ value: String(o.value), label: o.label })) || []} onChange={(val) => s(f.key, val)} required={f.required} />,
  ref: (f, v, s, en, rd) => <Select value={v} data={rd?.[f.ref]?.map(o => ({ value: o.id, label: o.name })) || []} onChange={(val) => s(f.key, val)} required={f.required} />,
  json: (f, v, s) => <Textarea value={typeof v === 'string' ? v : JSON.stringify(v || {})} onChange={(e) => s(f.key, e.target.value)} rows={4} required={f.required} />,
  image: (f, v, s) => <TextInput value={v} onChange={(e) => s(f.key, e.target.value)} placeholder="Image URL" />,
};

const FIELD_RENDERERS = {
  text: { form: FORM_FIELD_RENDERERS.text, list: (v) => <Text truncate>{v}</Text>, display: (v) => v, edit: EDIT_RENDERERS.text },
  email: { form: FORM_FIELD_RENDERERS.email, list: (v) => <Text truncate>{v}</Text>, display: (v) => v, edit: EDIT_RENDERERS.email },
  textarea: { form: FORM_FIELD_RENDERERS.textarea, list: LIST_RENDERERS.textarea, display: DISPLAY_RENDERERS.textarea, edit: EDIT_RENDERERS.textarea },
  date: { form: FORM_FIELD_RENDERERS.date, list: LIST_RENDERERS.date, display: DISPLAY_RENDERERS.date, edit: EDIT_RENDERERS.date },
  timestamp: { form: FORM_FIELD_RENDERERS.date, list: LIST_RENDERERS.timestamp, display: DISPLAY_RENDERERS.timestamp, edit: EDIT_RENDERERS.date },
  int: { form: FORM_FIELD_RENDERERS.int, list: (v) => String(v ?? ''), display: (v) => v, edit: EDIT_RENDERERS.int },
  decimal: { form: FORM_FIELD_RENDERERS.decimal, list: (v) => (typeof v === 'number' ? v.toFixed(2) : v), display: (v) => v, edit: EDIT_RENDERERS.decimal },
  bool: { form: FORM_FIELD_RENDERERS.bool, list: LIST_RENDERERS.bool, display: DISPLAY_RENDERERS.bool, edit: EDIT_RENDERERS.bool },
  enum: { form: FORM_FIELD_RENDERERS.enum, list: LIST_RENDERERS.enum, display: DISPLAY_RENDERERS.enum, edit: EDIT_RENDERERS.enum },
  ref: { form: FORM_FIELD_RENDERERS.ref, list: LIST_RENDERERS.ref, display: DISPLAY_RENDERERS.ref, edit: EDIT_RENDERERS.ref },
  json: { form: FORM_FIELD_RENDERERS.json, list: LIST_RENDERERS.json, display: DISPLAY_RENDERERS.json, edit: EDIT_RENDERERS.json },
  image: { form: FORM_FIELD_RENDERERS.image, list: LIST_RENDERERS.image, display: DISPLAY_RENDERERS.image, edit: EDIT_RENDERERS.image },
};

function renderField(fieldType, mode, ...args) {
  const renderer = FIELD_RENDERERS[fieldType]?.[mode] || FIELD_RENDERERS.text[mode];
  return renderer(...args);
}

function createSafeRenderer(mode, config = {}) {
  const { title = `${capitalize(mode)} Error`, textSize = 'sm', autoClose = 3000 } = config;
  return (...args) => {
    try {
      if (mode === 'form') {
        const [field, values, setField, enumData, refData] = args;
        const v = values[field.key] ?? '';
        if (field.type === 'enum') return renderField(field.type, 'form', field, v, setField, enumData);
        if (field.type === 'ref') return renderField(field.type, 'form', field, v, setField, enumData, refData);
        return renderField(field.type, 'form', field, v, setField);
      }
      if (mode === 'list') {
        const [value, column, spec, row] = args;
        return renderField(column.type, 'list', value, column, spec, row);
      }
      if (mode === 'display') {
        const [value, field, spec] = args;
        return renderField(field.type, 'display', value, field, spec);
      }
      if (mode === 'edit') {
        const [field, value, setField, spec] = args;
        return renderField(field.type, 'edit', field, value, setField, spec);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const field = mode === 'list' ? args[1] : args[0];
      const fieldKey = field?.key || 'unknown';
      const fieldLabel = field?.label || fieldKey;
      console.error(`[Renderer] ${capitalize(mode)} error for ${fieldKey}:`, { field: fieldKey, type: field?.type, error: msg });
      showNotification.warning(`Failed to render ${fieldLabel}: ${msg}`, title, autoClose);
      return <Tooltip label={`Error: ${msg}`}><Text size={textSize} c="gray">—</Text></Tooltip>;
    }
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const renderFormField = createSafeRenderer('form', { title: 'Form Field Error', autoClose: 4000 });
export const renderCellValue = createSafeRenderer('list', { title: 'Render Error' });
export const renderDisplayValue = createSafeRenderer('display', { title: 'Display Error' });
export const renderEditField = createSafeRenderer('edit', { title: 'Edit Field Error', autoClose: 4000 });

export class RenderingEngine {
  register(mode, fieldType, renderer) {
    if (!FIELD_RENDERERS[fieldType]) FIELD_RENDERERS[fieldType] = {};
    FIELD_RENDERERS[fieldType][mode] = renderer;
  }
  getRenderer(mode, fieldType) {
    return FIELD_RENDERERS[fieldType]?.[mode];
  }
}

export const renderingEngine = new RenderingEngine();
