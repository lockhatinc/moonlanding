import React from 'react';
import { Badge, Text, Avatar } from '@mantine/core';
import { FIELD_DISPLAY_RULES } from '@/config';
import { formatDate } from '@/lib/utils-client';

export function renderEnumBadge(value, field, spec) {
  const options = spec?.options?.[field.options];
  if (!options) return String(value ?? '');
  const opt = options.find(o => String(o.value) === String(value));
  return opt ? { label: opt.label, color: opt.color || 'gray' } : String(value);
}

export function renderEnumSelect(value, options) {
  if (!options) return value;
  const opt = options.find(o => String(o.value) === String(value));
  return opt ? opt.label : String(value);
}

export function renderRefDisplay(value, field, spec, row) {
  if (!field.display) return String(value ?? '');
  if (field.display === 'avatars' && Array.isArray(value)) {
    return { type: 'avatars', data: value };
  }
  return row?.[`${field.key}_display`] || String(value);
}

export function renderBoolDisplay(value) {
  return value ? FIELD_DISPLAY_RULES.boolean.displayTrue : FIELD_DISPLAY_RULES.boolean.displayFalse;
}

export function renderDateDisplay(value, format = FIELD_DISPLAY_RULES.date.format) {
  return formatDate(value, format) || '—';
}

export function renderTimestampDisplay(value, format = FIELD_DISPLAY_RULES.timestamp.format) {
  return formatDate(value, format) || '—';
}

export function renderJsonDisplay(value) {
  return typeof value === 'string' ? value : JSON.stringify(value, null, FIELD_DISPLAY_RULES.json.prettyPrint ? 2 : 0);
}

export function renderTruncated(value, maxLength = 50) {
  return String(value || '').substring(0, maxLength) + (String(value || '').length > maxLength ? '...' : '');
}
