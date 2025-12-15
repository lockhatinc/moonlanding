'use client';

import { Avatar, Badge } from '@mantine/core';
import { secondsToDate } from '@/lib/field-types';

const BADGE_COLORS = {
  green: { bg: '#d3f9d8', color: '#2f9e44' },
  yellow: { bg: '#fff3bf', color: '#f08c00' },
  amber: { bg: '#ffe066', color: '#d9480f' },
  blue: { bg: '#d0ebff', color: '#1971c2' },
  gray: { bg: '#f1f3f5', color: '#495057' },
  red: { bg: '#ffe0e0', color: '#c92a2a' },
};

export function renderCellValue(value, col, spec, row) {
  if (value === null || value === undefined) return '—';

  const field = spec.fields[col.key];
  if (!field) return String(value);

  if (field.type === 'enum') {
    const options = spec.options?.[field.options] || [];
    const opt = options.find(o => o.value === value);
    if (!opt) return value;

    const color = BADGE_COLORS[opt.color] || BADGE_COLORS.gray;
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
