import React from 'react';
import { TextInput, Textarea, NumberInput, Checkbox, Select, DateInput, Badge, Text, Group, Image as MImage } from '@mantine/core';
import { formatDate } from '@/lib/date-utils';

const RENDERERS = {
  text: {
    display: (v) => <Text size="sm" truncate>{v || '-'}</Text>,
    edit: (v, o, f) => <TextInput label={f.label} value={v || ''} onChange={(e) => o(e.target.value)} minLength={f.minLength} maxLength={f.maxLength} />,
  },
  email: {
    display: (v) => v ? <a href={`mailto:${v}`}><Text size="sm" color="blue">{v}</Text></a> : <Text size="sm">-</Text>,
    edit: (v, o, f) => <TextInput label={f.label} type="email" value={v || ''} onChange={(e) => o(e.target.value)} />,
  },
  textarea: {
    display: (v) => <Text size="sm" style={{whiteSpace: 'pre-wrap'}} truncate>{v || '-'}</Text>,
    edit: (v, o, f) => <Textarea label={f.label} value={v || ''} onChange={(e) => o(e.target.value)} minLength={f.minLength} maxLength={f.maxLength} />,
  },
  int: {
    display: (v) => <Text size="sm">{v || '-'}</Text>,
    edit: (v, o, f) => <NumberInput label={f.label} value={v} onChange={o} min={f.min} max={f.max} step={1} />,
  },
  decimal: {
    display: (v) => <Text size="sm">{v ? Number(v).toFixed(2) : '-'}</Text>,
    edit: (v, o, f) => <NumberInput label={f.label} value={v} onChange={o} min={f.min} max={f.max} precision={f.precision || 2} />,
  },
  date: {
    display: (v) => <Text size="sm">{v ? formatDate(v, 'locale') : '-'}</Text>,
    edit: (v, o, f) => <DateInput label={f.label} value={v ? new Date(typeof v === 'number' ? v * 1000 : v) : null} onChange={(d) => o(d?.toISOString())} />,
  },
  timestamp: {
    display: (v) => <Text size="sm">{v ? formatDate(v, 'datetime') : '-'}</Text>,
    edit: (v, o, f) => <DateInput label={f.label} value={v ? new Date(typeof v === 'number' ? v * 1000 : v) : null} onChange={(d) => o(d?.toISOString())} />,
  },
  bool: {
    display: (v) => <Badge color={v ? 'green' : 'gray'}>{v ? 'Yes' : 'No'}</Badge>,
    edit: (v, o, f) => <Checkbox label={f.label} checked={!!v} onChange={(e) => o(e.target.checked)} />,
  },
  enum: {
    display: (v, f, s) => {
      const opts = s?.options?.[f.options];
      const opt = opts?.find(o => String(o.value) === String(v));
      return <Badge color={opt?.color || 'gray'}>{opt?.label || v}</Badge>;
    },
    edit: (v, o, f, s) => {
      const opts = s?.options?.[f.options]?.map(op => ({ label: op.label, value: String(op.value) })) || [];
      return <Select label={f.label} data={opts} value={v ? String(v) : ''} onChange={o} searchable clearable />;
    },
  },
  ref: {
    display: (v) => <Text size="sm" truncate>{v || '-'}</Text>,
    edit: (v, o, f, s) => {
      const opts = s?.options?.[f.key]?.map(op => ({ label: op.label || op.value, value: op.value })) || [];
      return <Select label={f.label} data={opts} value={v ? String(v) : ''} onChange={o} searchable />;
    },
  },
  image: {
    display: (v) => v ? <MImage src={v} alt="img" height={40} width={40} fit="cover" /> : <Text size="sm">-</Text>,
    edit: (v, o, f) => <TextInput label={f.label} type="file" accept="image/*" />,
  },
  json: {
    display: (v) => <Text size="xs" style={{fontFamily: 'monospace'}} truncate>{typeof v === 'string' ? v : JSON.stringify(v)}</Text>,
    edit: (v, o, f) => <Textarea label={f.label} value={typeof v === 'string' ? v : JSON.stringify(v, null, 2)} onChange={(e) => o(e.target.value)} />,
  },
};

export const renderField = (field, value, mode = 'display', onChange, spec) => {
  const renderer = RENDERERS[field.type]?.[mode] || RENDERERS.text?.[mode];
  if (!renderer) return <span>Unknown field</span>;
  return renderer(value, onChange, field, spec);
};

export const FieldRenderer = ({ field, value, mode = 'display', onChange, spec, error }) => {
  return (
    <div>
      {renderField(field, value, mode, onChange, spec)}
      {error && <Text size="xs" color="red" mt={4}>{error}</Text>}
    </div>
  );
};
