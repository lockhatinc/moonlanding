import React from 'react';
import { TextInput, Textarea, Select, Checkbox, NumberInput, Avatar, Badge, Text, Image as MImage, Tooltip } from '@mantine/core';
import { secondsToDate, dateToSeconds } from '@/lib/utils-client';
import { renderEnumBadge, renderBoolDisplay, renderDateDisplay, renderTimestampDisplay, renderJsonDisplay } from '@/lib/renderer-helpers';
import { FORM_FIELD_DEFAULTS } from './form-rendering-config';

export const EDITABLE_FIELD_RENDERERS = {
  text: (f, v, s, _, __, onBlur, includeNameAttr) => <TextInput {...(includeNameAttr && { name: f.key })} value={v} onChange={(e) => s(f.key, e.target.value)} onBlur={onBlur} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  email: (f, v, s, _, __, onBlur, includeNameAttr) => <TextInput {...(includeNameAttr && { name: f.key })} type="email" value={v} onChange={(e) => s(f.key, e.target.value)} onBlur={onBlur} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  textarea: (f, v, s, _, __, onBlur, includeNameAttr) => <Textarea {...(includeNameAttr && { name: f.key })} value={v} onChange={(e) => s(f.key, e.target.value)} onBlur={onBlur} rows={FORM_FIELD_DEFAULTS.textarea.defaultRows} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  date: (f, v, s, _, __, onBlur, includeNameAttr) => <input type="date" {...(includeNameAttr && { name: f.key })} value={v ? secondsToDate(v).toISOString().split('T')[0] : ''} onChange={(e) => s(f.key, e.target.value ? dateToSeconds(new Date(e.target.value)) : '')} onBlur={onBlur} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--mantine-color-gray-4)', borderRadius: 4 }} />,
  int: (f, v, s, _, __, onBlur, includeNameAttr) => <NumberInput {...(includeNameAttr && { name: f.key })} value={v} onChange={(x) => { s(f.key, x); onBlur?.(); }} required={f.required} step={FORM_FIELD_DEFAULTS.numberInput.intStep} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  decimal: (f, v, s, _, __, onBlur, includeNameAttr) => <NumberInput {...(includeNameAttr && { name: f.key })} value={v} onChange={(x) => { s(f.key, x); onBlur?.(); }} required={f.required} decimalScale={FORM_FIELD_DEFAULTS.numberInput.decimalScale} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  bool: (f, v, s, _, __, onBlur) => <Checkbox label={f.label} checked={!!v} onChange={(e) => { s(f.key, e.currentTarget.checked); onBlur?.(); }} aria-checked={!!v} aria-label={f.label} />,
  enum: (f, v, s, en, _, onBlur) => <Select value={v} data={en?.[f.options]?.map(o => ({ value: String(o.value), label: o.label })) || []} onChange={(val) => { s(f.key, val); onBlur?.(); }} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  ref: (f, v, s, en, rd, onBlur) => <Select value={v} data={rd?.[f.ref]?.map(o => ({ value: o.id, label: o.name })) || []} onChange={(val) => { s(f.key, val); onBlur?.(); }} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  json: (f, v, s, _, __, onBlur, includeNameAttr) => <Textarea value={typeof v === 'string' ? v : JSON.stringify(v || {})} onChange={(e) => s(f.key, e.target.value)} onBlur={onBlur} rows={FORM_FIELD_DEFAULTS.jsonField.defaultRows} required={f.required} aria-required={f.required} aria-label={f.label} aria-describedby={`${f.key}-error`} />,
  image: (f, v, s, _, __, onBlur, includeNameAttr) => <TextInput value={v} onChange={(e) => s(f.key, e.target.value)} onBlur={onBlur} placeholder="Image URL" aria-label={f.label} />,
};

export const LIST_RENDERERS = {
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

export const DISPLAY_RENDERERS = {
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

export const getFieldRenderers = (fieldType) => ({
  form: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS[fieldType]?.(f, v, s, ...rest, true),
  list: LIST_RENDERERS[fieldType],
  display: DISPLAY_RENDERERS[fieldType],
  edit: (f, v, s, ...rest) => EDITABLE_FIELD_RENDERERS[fieldType]?.(f, v, s, ...rest, false),
});
