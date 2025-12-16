import React, { useMemo } from 'react';
import { Group, Text, Badge, Tooltip } from '@mantine/core';

const truncate = (text, limit = 40) => {
  if (!text) return '';
  const str = String(text);
  return str.length > limit ? str.substring(0, limit) + '...' : str;
};

export function FieldPreview({ field, value, spec }) {
  const preview = useMemo(() => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'email':
        return truncate(String(value), 40);

      case 'int':
      case 'decimal':
        return String(value);

      case 'bool':
        return value ? '✓' : '○';

      case 'date':
      case 'timestamp':
        if (typeof value === 'number') {
          const date = new Date(value * 1000);
          return date.toLocaleDateString();
        }
        return new Date(value).toLocaleDateString();

      case 'enum':
        if (!spec) return String(value);
        const options = spec.options?.[field.options];
        if (!options) return String(value);
        const option = options.find(o => String(o.value) === String(value));
        return option?.label || String(value);

      case 'ref':
        return truncate(String(value), 30);

      case 'image':
        return '📷';

      case 'json':
        return '{}';

      default:
        return truncate(String(value), 40);
    }
  }, [field, value, spec]);

  return (
    <Tooltip label={value} disabled={!value}>
      <Text size="sm" truncate>
        {preview}
      </Text>
    </Tooltip>
  );
}

export function CompactFieldPreview({ field, value, spec, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: onClick ? '#f0f0f0' : 'transparent',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.backgroundColor = '#e8e8e8')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.backgroundColor = '#f0f0f0')}
    >
      <FieldPreview field={field} value={value} spec={spec} />
    </div>
  );
}
