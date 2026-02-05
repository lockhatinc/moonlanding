import React from 'react';
import { TextInput, Textarea, Select, Checkbox, NumberInput, Avatar, Badge, Text, Image as MImage, Tooltip } from '@mantine/core';
import { secondsToDate, dateToSeconds, formatDate } from '@/lib/field-types';
import { showNotification } from '@/lib/notification-helpers';

function renderEnumBadge(value, field, spec) {
  const options = spec?.options?.[field.options];
  if (!options) return String(value ?? '');
  const opt = options.find(o => String(o.value) === String(value));
  return opt ? { label: opt.label, color: opt.color || 'gray' } : String(value);
}

const EDITABLE_FIELD_RENDERERS = {
  text: (f, v, s, _, __, onBlur, n) => <TextInput {...(n && { name: f.key })} value={v} onChange={(e) => s(f.key, e.target.value)} onBlur={onBlur} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  email: (f, v, s, _, __, onBlur, n) => <TextInput {...(n && { name: f.key })} type="email" value={v} onChange={(e) => s(f.key, e.target.value)} onBlur={onBlur} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  textarea: (f, v, s, _, __, onBlur, n) => <Textarea {...(n && { name: f.key })} value={v} onChange={(e) => s(f.key, e.target.value)} onBlur={onBlur} rows={3} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  date: (f, v, s, _, __, onBlur, n) => <input type="date" {...(n && { name: f.key })} value={v ? secondsToDate(v).toISOString().split('T')[0] : ''} onChange={(e) => s(f.key, e.target.value ? dateToSeconds(new Date(e.target.value)) : '')} onBlur={onBlur} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--mantine-color-gray-4)', borderRadius: 4 }} />,
  int: (f, v, s, _, __, onBlur, n) => <NumberInput {...(n && { name: f.key })} value={v} onChange={(x) => { s(f.key, x); onBlur?.(); }} required={f.required} step={1} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  decimal: (f, v, s, _, __, onBlur, n) => <NumberInput {...(n && { name: f.key })} value={v} onChange={(x) => { s(f.key, x); onBlur?.(); }} required={f.required} decimalScale={2} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  bool: (f, v, s, _, __, onBlur) => <Checkbox label={f.label} checked={!!v} onChange={(e) => { s(f.key, e.currentTarget.checked); onBlur?.(); }} aria-checked={!!v} aria-label={f.label} />,
  enum: (f, v, s, en, _, onBlur) => <Select value={v} data={en?.[f.options]?.map(o => ({ value: String(o.value), label: o.label })) || []} onChange={(val) => { s(f.key, val); onBlur?.(); }} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  ref: (f, v, s, en, rd, onBlur) => <Select value={v} data={rd?.[f.ref]?.map(o => ({ value: o.id, label: o.name })) || []} onChange={(val) => { s(f.key, val); onBlur?.(); }} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  json: (f, v, s, _, __, onBlur) => <Textarea value={typeof v === 'string' ? v : JSON.stringify(v || {})} onChange={(e) => s(f.key, e.target.value)} onBlur={onBlur} rows={4} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  image: (f, v, s, _, __, onBlur) => <TextInput value={v} onChange={(e) => s(f.key, e.target.value)} onBlur={onBlur} placeholder="Image URL" aria-label={f.label} />,
};

const LIST_RENDERERS = {
  text: (v) => <Text truncate>{v}</Text>,
  email: (v) => <Text truncate>{v}</Text>,
  textarea: (v) => <Text truncate>{v}</Text>,
  json: (v) => <Text truncate size="xs">{typeof v === 'string' ? v : JSON.stringify(v)}</Text>,
  int: (v) => String(v ?? ''),
  decimal: (v) => typeof v === 'number' ? v.toFixed(2) : v,
  bool: (v) => v ? '\u2713' : '\u2014',
  date: (v) => formatDate(v, 'short') || '\u2014',
  timestamp: (v) => formatDate(v, 'datetime') || '\u2014',
  enum: (v, c, spec) => {
    const badge = renderEnumBadge(v, c, spec);
    return typeof badge === 'string' ? badge : <Badge color={badge.color}>{badge.label}</Badge>;
  },
  ref: (v, c, spec, row) => {
    if (!c.display) return String(v ?? '');
    if (c.display === 'avatars' && Array.isArray(v)) return <Avatar.Group size="xs">{v.map(uid => <Avatar key={uid} src="" />)}</Avatar.Group>;
    return row?.[`${c.key}_display`] || String(v ?? '');
  },
  image: (v) => v ? <MImage src={v} height={40} width={40} /> : '\u2014',
};

const DISPLAY_RENDERERS = {
  text: (v) => v,
  email: (v) => v,
  textarea: (v) => <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{v}</Text>,
  json: (v) => <Text size="xs" c="dimmed">{typeof v === 'string' ? v : JSON.stringify(v, null, 2)}</Text>,
  int: (v) => v,
  decimal: (v) => v,
  bool: (v) => (v ? 'Yes' : 'No'),
  date: (v) => formatDate(v) || '\u2014',
  timestamp: (v) => formatDate(v, 'datetime') || '\u2014',
  enum: (v, field, spec) => {
    const badge = renderEnumBadge(v, field, spec);
    return typeof badge === 'string' ? badge : <Badge color={badge.color}>{badge.label}</Badge>;
  },
  ref: (v, field, spec) => spec?.entities?.[field.ref]?.name || String(v ?? ''),
  image: (v) => v ? <MImage src={v} height={200} /> : '\u2014',
};

function getFieldRenderers(fieldType) {
  return {
    form: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS[fieldType]?.(f, v, s, ...rest, true),
    list: LIST_RENDERERS[fieldType],
    display: DISPLAY_RENDERERS[fieldType],
    edit: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS[fieldType]?.(f, v, s, ...rest, false),
  };
}

const FIELD_RENDERERS = {};
for (const type of Object.keys(EDITABLE_FIELD_RENDERERS)) {
  FIELD_RENDERERS[type] = getFieldRenderers(type);
}

function renderField(fieldType, mode, ...args) {
  const renderer = FIELD_RENDERERS[fieldType]?.[mode] || FIELD_RENDERERS.text[mode];
  return renderer(...args);
}

function createSafeRenderer(mode) {
  return (...args) => {
    try {
      if (mode === 'form') {
        const [field, values, setField, enumData, refData, onBlur] = args;
        const v = values[field.key] ?? '';
        if (field.type === 'enum') return renderField(field.type, 'form', field, v, setField, enumData, undefined, onBlur);
        if (field.type === 'ref') return renderField(field.type, 'form', field, v, setField, enumData, refData, onBlur);
        return renderField(field.type, 'form', field, v, setField, undefined, undefined, onBlur);
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
      console.error(`[Renderer] ${mode} error for ${field?.key}:`, msg);
      showNotification.warning(`Failed to render ${field?.label || field?.key}: ${msg}`);
      return <Tooltip label={`Error: ${msg}`}><Text size="sm" c="gray">{'\u2014'}</Text></Tooltip>;
    }
  };
}

export const renderFormField = createSafeRenderer('form');
export const renderCellValue = createSafeRenderer('list');
export const renderDisplayValue = createSafeRenderer('display');
export const renderEditField = createSafeRenderer('edit');

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
export { EDITABLE_FIELD_RENDERERS, LIST_RENDERERS, DISPLAY_RENDERERS, getFieldRenderers };
