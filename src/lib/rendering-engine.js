import React from 'react';
import { TextInput, Textarea, Select, Checkbox, NumberInput, Avatar, Badge, Text, Image as MImage, Tooltip } from '@mantine/core';
import { secondsToDate, dateToSeconds } from '@/lib/utils-client';
import { showNotification } from './notification-helpers';
import { renderEnumBadge, renderBoolDisplay, renderDateDisplay, renderTimestampDisplay, renderJsonDisplay } from './renderer-helpers';
import { FORM_FIELD_DEFAULTS } from '@/config/form-rendering-config';

const EDITABLE_FIELD_RENDERERS = {
  text: (f, v, s, _, __, includeNameAttr) => <TextInput {...(includeNameAttr && { name: f.key })} value={v} onChange={(e) => s(f.key, e.target.value)} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  email: (f, v, s, _, __, includeNameAttr) => <TextInput {...(includeNameAttr && { name: f.key })} type="email" value={v} onChange={(e) => s(f.key, e.target.value)} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  textarea: (f, v, s, _, __, includeNameAttr) => <Textarea {...(includeNameAttr && { name: f.key })} value={v} onChange={(e) => s(f.key, e.target.value)} rows={FORM_FIELD_DEFAULTS.textarea.defaultRows} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  date: (f, v, s, _, __, includeNameAttr) => <input type="date" {...(includeNameAttr && { name: f.key })} value={v ? secondsToDate(v).toISOString().split('T')[0] : ''} onChange={(e) => s(f.key, e.target.value ? dateToSeconds(new Date(e.target.value)) : '')} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--mantine-color-gray-4)', borderRadius: 4 }} />,
  int: (f, v, s, _, __, includeNameAttr) => <NumberInput {...(includeNameAttr && { name: f.key })} value={v} onChange={(x) => s(f.key, x)} required={f.required} step={FORM_FIELD_DEFAULTS.numberInput.intStep} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  decimal: (f, v, s, _, __, includeNameAttr) => <NumberInput {...(includeNameAttr && { name: f.key })} value={v} onChange={(x) => s(f.key, x)} required={f.required} decimalScale={FORM_FIELD_DEFAULTS.numberInput.decimalScale} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  bool: (f, v, s) => <Checkbox label={f.label} checked={!!v} onChange={(e) => s(f.key, e.currentTarget.checked)} aria-checked={!!v} aria-label={f.label} />,
  enum: (f, v, s, en) => <Select value={v} data={en?.[f.options]?.map(o => ({ value: String(o.value), label: o.label })) || []} onChange={(val) => s(f.key, val)} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  ref: (f, v, s, en, rd) => <Select value={v} data={rd?.[f.ref]?.map(o => ({ value: o.id, label: o.name })) || []} onChange={(val) => s(f.key, val)} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  json: (f, v, s) => <Textarea value={typeof v === 'string' ? v : JSON.stringify(v || {})} onChange={(e) => s(f.key, e.target.value)} rows={FORM_FIELD_DEFAULTS.jsonField.defaultRows} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  image: (f, v, s) => <TextInput value={v} onChange={(e) => s(f.key, e.target.value)} placeholder="Image URL" aria-label={f.label} />,
};

const LIST_RENDERERS = {
  text: (v) => <Text truncate>{v}</Text>,
  email: (v) => <Text truncate>{v}</Text>,
  textarea: (v) => <Text truncate>{v}</Text>,
  json: (v) => <Text truncate size="xs">{typeof v === 'string' ? v : JSON.stringify(v)}</Text>,
  int: (v) => String(v ?? ''),
  decimal: (v) => typeof v === 'number' ? v.toFixed(2) : v,
  bool: (v) => v ? '✓' : '—',
  date: (v) => renderDateDisplay(v, 'short'),
  timestamp: (v) => renderTimestampDisplay(v, 'datetime'),
  enum: (v, c, spec) => {
    const badge = renderEnumBadge(v, c, spec);
    return typeof badge === 'string' ? badge : <Badge color={badge.color}>{badge.label}</Badge>;
  },
  ref: (v, c, spec, row) => {
    if (!c.display) return String(v ?? '');
    if (c.display === 'avatars' && Array.isArray(v)) return <Avatar.Group size="xs">{v.map(uid => <Avatar key={uid} src="" />)}</Avatar.Group>;
    return row?.[`${c.key}_display`] || String(v ?? '');
  },
  image: (v) => v ? <MImage src={v} height={FORM_FIELD_DEFAULTS.imageField.listHeight} width={FORM_FIELD_DEFAULTS.imageField.listWidth} /> : FORM_FIELD_DEFAULTS.imageField.placeholder,
};

const DISPLAY_RENDERERS = {
  text: (v) => v,
  email: (v) => v,
  textarea: (v) => <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{v}</Text>,
  json: (v) => <Text size="xs" c="dimmed">{renderJsonDisplay(v)}</Text>,
  int: (v) => v,
  decimal: (v) => v,
  bool: (v) => renderBoolDisplay(v),
  date: (v) => renderDateDisplay(v),
  timestamp: (v) => renderTimestampDisplay(v),
  enum: (v, field, spec) => {
    const badge = renderEnumBadge(v, field, spec);
    return typeof badge === 'string' ? badge : <Badge color={badge.color}>{badge.label}</Badge>;
  },
  ref: (v, field, spec) => spec?.entities?.[field.ref]?.name || String(v ?? ''),
  image: (v) => v ? <MImage src={v} height={FORM_FIELD_DEFAULTS.imageField.detailHeight} /> : FORM_FIELD_DEFAULTS.imageField.placeholder,
};

const FIELD_RENDERERS = {
  text: { form: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.text(f, v, s, ...rest, true), list: LIST_RENDERERS.text, display: DISPLAY_RENDERERS.text, edit: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.text(f, v, s, ...rest, false) },
  email: { form: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.email(f, v, s, ...rest, true), list: LIST_RENDERERS.email, display: DISPLAY_RENDERERS.email, edit: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.email(f, v, s, ...rest, false) },
  textarea: { form: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.textarea(f, v, s, ...rest, true), list: LIST_RENDERERS.textarea, display: DISPLAY_RENDERERS.textarea, edit: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.textarea(f, v, s, ...rest, false) },
  date: { form: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.date(f, v, s, ...rest, true), list: LIST_RENDERERS.date, display: DISPLAY_RENDERERS.date, edit: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.date(f, v, s, ...rest, false) },
  timestamp: { form: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.date(f, v, s, ...rest, true), list: LIST_RENDERERS.timestamp, display: DISPLAY_RENDERERS.timestamp, edit: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.date(f, v, s, ...rest, false) },
  int: { form: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.int(f, v, s, ...rest, true), list: LIST_RENDERERS.int, display: DISPLAY_RENDERERS.int, edit: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.int(f, v, s, ...rest, false) },
  decimal: { form: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.decimal(f, v, s, ...rest, true), list: LIST_RENDERERS.decimal, display: DISPLAY_RENDERERS.decimal, edit: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS.decimal(f, v, s, ...rest, false) },
  bool: { form: EDITABLE_FIELD_RENDERERS.bool, list: LIST_RENDERERS.bool, display: DISPLAY_RENDERERS.bool, edit: EDITABLE_FIELD_RENDERERS.bool },
  enum: { form: EDITABLE_FIELD_RENDERERS.enum, list: LIST_RENDERERS.enum, display: DISPLAY_RENDERERS.enum, edit: EDITABLE_FIELD_RENDERERS.enum },
  ref: { form: EDITABLE_FIELD_RENDERERS.ref, list: LIST_RENDERERS.ref, display: DISPLAY_RENDERERS.ref, edit: EDITABLE_FIELD_RENDERERS.ref },
  json: { form: EDITABLE_FIELD_RENDERERS.json, list: LIST_RENDERERS.json, display: DISPLAY_RENDERERS.json, edit: EDITABLE_FIELD_RENDERERS.json },
  image: { form: EDITABLE_FIELD_RENDERERS.image, list: LIST_RENDERERS.image, display: DISPLAY_RENDERERS.image, edit: EDITABLE_FIELD_RENDERERS.image },
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
