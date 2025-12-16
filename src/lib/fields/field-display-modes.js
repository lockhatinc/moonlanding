import React from 'react';
import { Badge, Group, Text, Image as MImage, Stack } from '@mantine/core';
import { formatFieldValue } from '@/lib/field-registry';
import { formatDate } from '@/lib/date-utils';

const truncate = (text, limit = 50) => {
  if (!text) return '';
  const str = String(text);
  return str.length > limit ? str.substring(0, limit) + '...' : str;
};

export const DISPLAY_RENDERERS = {
  default: ({ value }) => (
    <Text size="sm">{value !== null && value !== undefined ? String(value) : '-'}</Text>
  ),

  text: ({ value }) => (
    <Text size="sm" title={value}>
      {truncate(value, 100)}
    </Text>
  ),

  textarea: ({ value }) => (
    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} title={value}>
      {truncate(value, 150)}
    </Text>
  ),

  email: ({ value }) => (
    <a href={`mailto:${value}`} style={{ textDecoration: 'none' }}>
      <Text size="sm" color="blue">
        {value}
      </Text>
    </a>
  ),

  int: ({ value }) => (
    <Text size="sm">{value !== null && value !== undefined ? Number(value) : '-'}</Text>
  ),

  decimal: ({ value }) => (
    <Text size="sm">{value !== null && value !== undefined ? Number(value).toFixed(2) : '-'}</Text>
  ),

  date: ({ value }) => (
    <Text size="sm">{value ? formatDate(value, 'locale') : '-'}</Text>
  ),

  timestamp: ({ value }) => (
    <Text size="sm">{value ? formatDate(value, 'datetime') : '-'}</Text>
  ),

  bool: ({ value }) => (
    <Badge color={value ? 'green' : 'gray'} size="sm">
      {value ? 'Yes' : 'No'}
    </Badge>
  ),

  enum: ({ value, field, spec }) => {
    if (!value || !spec) return <Text size="sm">{value}</Text>;

    const options = spec.options?.[field.options];
    if (!options) return <Text size="sm">{value}</Text>;

    const option = options.find(o => String(o.value) === String(value));
    if (!option) return <Text size="sm">{value}</Text>;

    return (
      <Badge color={option.color || 'gray'} size="sm">
        {option.label}
      </Badge>
    );
  },

  ref: ({ value, field, spec, row }) => {
    if (!value) return <Text size="sm">-</Text>;

    if (field.display === 'avatars' && Array.isArray(value)) {
      return (
        <Group spacing="xs">
          {value.slice(0, 3).map(v => (
            <div key={v} style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
            }}>
              {String(v).charAt(0).toUpperCase()}
            </div>
          ))}
          {value.length > 3 && <Text size="xs">+{value.length - 3}</Text>}
        </Group>
      );
    }

    const displayValue = row?.[`${field.key}_display`] || value;
    return <Text size="sm">{displayValue}</Text>;
  },

  image: ({ value }) => {
    if (!value) return <Text size="sm">-</Text>;
    return (
      <MImage
        src={value}
        alt="field-image"
        height={40}
        width={40}
        fit="cover"
        radius="sm"
      />
    );
  },

  json: ({ value }) => {
    if (!value) return <Text size="sm">-</Text>;
    const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
    return (
      <Text size="xs" style={{ fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {truncate(jsonStr, 100)}
      </Text>
    );
  },

  id: ({ value }) => (
    <Text size="xs" style={{ fontFamily: 'monospace', color: '#666' }}>
      {truncate(value, 12)}
    </Text>
  ),
};

export function initializeDisplayRenderers(rendererRegistry) {
  for (const [type, component] of Object.entries(DISPLAY_RENDERERS)) {
    rendererRegistry.registerRenderer(type, 'display', component);
  }
}
