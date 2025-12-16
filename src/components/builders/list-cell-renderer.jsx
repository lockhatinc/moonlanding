'use client';

import { Avatar, Badge } from '@mantine/core';
import { secondsToDate, getBadgeStyle } from '@/lib/field-registry';
import { BADGE_COLORS_MANTINE } from '@/config/constants';

export function renderCellValue(value, col, spec, row) {
  if (value === null || value === undefined) return '—';

  const field = spec.fields[col.key];
  if (!field) return String(value);

  if (field.type === 'enum') {
    const options = spec.options?.[field.options] || [];
    const opt = options.find(o => o.value === value);
    if (!opt) return value;

    const color = getBadgeStyle(opt.color);
    return (
      <Badge style={{ backgroundColor: color.bg, color: color.color, border: 'none' }}>
        {opt.label}
      </Badge>
    );
  }

  if (field.type === 'bool') {
    return value ? '✓' : '—';
  }

  if (field.type === 'date' || field.type === 'timestamp') {
    if (!value) return '—';
    const date = secondsToDate(value);
    return date ? date.toLocaleDateString() : '—';
  }

  if (field.type === 'image') {
    return (
      <Avatar src={value} size="sm">
        {row.name?.[0] || '?'}
      </Avatar>
    );
  }

  if (field.type === 'json') {
    return <code style={{ fontSize: 12 }}>{JSON.stringify(value).substring(0, 30)}</code>;
  }

  return String(value);
}
