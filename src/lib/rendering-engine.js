import React from 'react';
import { TextInput, Textarea, Select, Checkbox, NumberInput, Stack, Avatar, Badge, Text, Image as MImage } from '@mantine/core';
import { secondsToDate, dateToSeconds, getBadgeStyle } from '@/lib/field-registry';
import { BADGE_COLORS_MANTINE } from '@/config/constants';

class RenderingEngine {
  constructor() {
    this.renderers = {
      form: {},
      list: {},
      display: {},
      edit: {},
    };
    this.initializeDefaults();
  }

  initializeDefaults() {
    this.registerFormRenderers();
    this.registerListRenderers();
    this.registerDisplayRenderers();
    this.registerEditRenderers();
  }

  registerFormRenderers() {
    this.renderers.form = {
      textarea: (field, val, setField) => (
        <Textarea
          name={field.key}
          value={val}
          onChange={(e) => setField(field.key, e.target.value)}
          rows={3}
          required={field.required}
        />
      ),
      date: (field, val, setField) => (
        <input
          type="date"
          name={field.key}
          value={val ? secondsToDate(val).toISOString().split('T')[0] : ''}
          onChange={(e) => setField(field.key, e.target.value ? dateToSeconds(new Date(e.target.value)) : '')}
          required={field.required}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--mantine-color-gray-4)', borderRadius: 4 }}
        />
      ),
      int: (field, val, setField) => (
        <NumberInput
          name={field.key}
          value={val}
          onChange={(v) => setField(field.key, v)}
          required={field.required}
          step={1}
        />
      ),
      decimal: (field, val, setField) => (
        <NumberInput
          name={field.key}
          value={val}
          onChange={(v) => setField(field.key, v)}
          required={field.required}
          decimalScale={2}
        />
      ),
      bool: (field, val, setField) => (
        <Checkbox
          name={field.key}
          label={field.label}
          checked={!!val}
          onChange={(e) => setField(field.key, e.currentTarget.checked)}
        />
      ),
      enum: (field, val, setField, enumData) => (
        <Select
          name={field.key}
          value={val ? String(val) : null}
          onChange={(v) => setField(field.key, v)}
          data={enumData?.[field.key] || []}
          placeholder={`Select ${field.label}`}
          required={field.required}
          clearable
        />
      ),
      ref: (field, val, setField, enumData, refData) => (
        <Select
          name={field.key}
          value={val || null}
          onChange={(v) => setField(field.key, v)}
          data={refData?.[field.key] || []}
          placeholder={`Select ${field.label}`}
          searchable
          clearable
          required={field.required}
        />
      ),
      email: (field, val, setField) => (
        <TextInput
          type="email"
          name={field.key}
          value={val}
          onChange={(e) => setField(field.key, e.target.value)}
          required={field.required}
        />
      ),
      image: (field, val, setField) => (
        <Stack gap="xs">
          <TextInput
            name={field.key}
            value={val}
            onChange={(e) => setField(field.key, e.target.value)}
            placeholder="Image URL"
            required={field.required}
          />
          {val && <Avatar src={val} size="lg" />}
        </Stack>
      ),
      text: (field, val, setField) => (
        <TextInput
          name={field.key}
          value={val}
          onChange={(e) => setField(field.key, e.target.value)}
          required={field.required}
        />
      ),
      json: (field, val, setField) => (
        <Textarea
          name={field.key}
          value={typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
          onChange={(e) => setField(field.key, e.target.value)}
          required={field.required}
          rows={5}
        />
      ),
      timestamp: (field, val, setField) => this.renderers.form.date(field, val, setField),
    };
  }

  registerListRenderers() {
    this.renderers.list = {
      enum: (value, field, spec) => {
        if (value === null || value === undefined) return '—';
        const options = spec.options?.[field.options] || [];
        const opt = options.find((o) => o.value === value);
        if (!opt) return value;
        const color = getBadgeStyle(opt.color);
        return (
          <Badge style={{ backgroundColor: color.bg, color: color.color, border: 'none' }}>
            {opt.label}
          </Badge>
        );
      },
      bool: (value) => (value ? '✓' : '—'),
      date: (value) => {
        if (value === null || value === undefined) return '—';
        const date = secondsToDate(value);
        return date ? date.toLocaleDateString() : '—';
      },
      timestamp: (value) => this.renderers.list.date(value),
      image: (value, field, spec, row) => (
        <Avatar src={value} size="sm">
          {row.name?.[0] || '?'}
        </Avatar>
      ),
      json: (value) => (
        <code style={{ fontSize: 12 }}>
          {JSON.stringify(value).substring(0, 30)}
        </code>
      ),
      text: (value) => value === null || value === undefined ? '—' : String(value),
      textarea: (value) => value === null || value === undefined ? '—' : String(value).substring(0, 50),
      email: (value) => value === null || value === undefined ? '—' : String(value),
      int: (value) => value === null || value === undefined ? '—' : String(value),
      decimal: (value) => value === null || value === undefined ? '—' : Number(value).toFixed(2),
      ref: (value) => value === null || value === undefined ? '—' : String(value),
    };
  }

  registerDisplayRenderers() {
    this.renderers.display = {
      text: (val) => <Text size="sm" truncate>{val || '-'}</Text>,
      email: (val) => val ? <a href={`mailto:${val}`}><Text size="sm" color="blue">{val}</Text></a> : <Text size="sm">-</Text>,
      textarea: (val) => <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} truncate>{val || '-'}</Text>,
      int: (val) => <Text size="sm">{val || '-'}</Text>,
      decimal: (val) => <Text size="sm">{val ? Number(val).toFixed(2) : '-'}</Text>,
      date: (val) => <Text size="sm">{val ? secondsToDate(val).toLocaleDateString() : '-'}</Text>,
      timestamp: (val) => <Text size="sm">{val ? secondsToDate(val).toLocaleString() : '-'}</Text>,
      bool: (val) => <Badge color={val ? 'green' : 'gray'}>{val ? 'Yes' : 'No'}</Badge>,
      enum: (val, field, spec) => {
        const opts = spec?.options?.[field.options];
        const opt = opts?.find((o) => String(o.value) === String(val));
        return <Badge color={opt?.color || 'gray'}>{opt?.label || val}</Badge>;
      },
      ref: (val) => <Text size="sm" truncate>{val || '-'}</Text>,
      image: (val) => val ? <MImage src={val} alt="img" height={40} width={40} fit="cover" /> : <Text size="sm">-</Text>,
      json: (val) => <Text size="xs" style={{ fontFamily: 'monospace' }} truncate>{typeof val === 'string' ? val : JSON.stringify(val)}</Text>,
    };
  }

  registerEditRenderers() {
    this.renderers.edit = {
      text: (field, val, setField) => (
        <TextInput
          label={field.label}
          value={val || ''}
          onChange={(e) => setField(e.target.value)}
        />
      ),
      email: (field, val, setField) => (
        <TextInput
          label={field.label}
          type="email"
          value={val || ''}
          onChange={(e) => setField(e.target.value)}
        />
      ),
      textarea: (field, val, setField) => (
        <Textarea
          label={field.label}
          value={val || ''}
          onChange={(e) => setField(e.target.value)}
        />
      ),
      int: (field, val, setField) => (
        <NumberInput
          label={field.label}
          value={val}
          onChange={setField}
          step={1}
        />
      ),
      decimal: (field, val, setField) => (
        <NumberInput
          label={field.label}
          value={val}
          onChange={setField}
          precision={2}
        />
      ),
      date: (field, val, setField) => (
        <input
          type="date"
          value={val ? secondsToDate(val).toISOString().split('T')[0] : ''}
          onChange={(e) => setField(e.target.value ? dateToSeconds(new Date(e.target.value)) : '')}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
        />
      ),
      timestamp: (field, val, setField) => this.renderers.edit.date(field, val, setField),
      bool: (field, val, setField) => (
        <Checkbox
          label={field.label}
          checked={!!val}
          onChange={(e) => setField(e.currentTarget.checked)}
        />
      ),
      enum: (field, val, setField, spec) => {
        const opts = spec?.options?.[field.options]?.map((op) => ({ label: op.label, value: String(op.value) })) || [];
        return (
          <Select
            label={field.label}
            data={opts}
            value={val ? String(val) : ''}
            onChange={setField}
            searchable
            clearable
          />
        );
      },
      ref: (field, val, setField, spec) => {
        const opts = spec?.options?.[field.key]?.map((op) => ({ label: op.label || op.value, value: op.value })) || [];
        return (
          <Select
            label={field.label}
            data={opts}
            value={val ? String(val) : ''}
            onChange={setField}
            searchable
          />
        );
      },
      image: (field, val, setField) => (
        <TextInput
          label={field.label}
          type="file"
          accept="image/*"
        />
      ),
      json: (field, val, setField) => (
        <Textarea
          label={field.label}
          value={typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
          onChange={(e) => setField(e.target.value)}
        />
      ),
    };
  }

  register(mode, fieldType, renderer) {
    if (!this.renderers[mode]) {
      this.renderers[mode] = {};
    }
    this.renderers[mode][fieldType] = renderer;
  }

  getRenderer(mode, fieldType) {
    return this.renderers[mode]?.[fieldType] || this.renderers[mode]?.text;
  }

  render(field, value, mode = 'display', context = {}) {
    const renderer = this.getRenderer(mode, field.type);
    if (!renderer) {
      console.error(`[RenderingEngine] No renderer for mode=${mode}, type=${field.type}`);
      return <span>Unknown field</span>;
    }

    try {
      if (mode === 'form') {
        return renderer(field, value, context.setField, context.enumData, context.refData);
      }
      if (mode === 'list') {
        return renderer(value, field, context.spec, context.row);
      }
      if (mode === 'display') {
        return renderer(value, field, context.spec);
      }
      if (mode === 'edit') {
        return renderer(field, value, context.setField, context.spec);
      }
      return renderer(value);
    } catch (e) {
      console.error(`[RenderingEngine] Render error for field=${field.key}, mode=${mode}:`, e);
      return <span>Render error</span>;
    }
  }

  renderFormField(field, values, setField, enumData, refData) {
    const val = values[field.key] ?? '';
    return this.render(field, val, 'form', { setField, enumData, refData });
  }

  renderCellValue(value, column, spec, row) {
    return this.render(column, value, 'list', { spec, row });
  }

  renderDisplayValue(value, field, spec) {
    return this.render(field, value, 'display', { spec });
  }

  renderEditField(field, value, setField, spec) {
    return this.render(field, value, 'edit', { setField, spec });
  }
}

export const renderingEngine = new RenderingEngine();

export function renderFormField(field, values, setField, enumData, refData) {
  return renderingEngine.renderFormField(field, values, setField, enumData, refData);
}

export function renderCellValue(value, column, spec, row) {
  return renderingEngine.renderCellValue(value, column, spec, row);
}

export function renderDisplayValue(value, field, spec) {
  return renderingEngine.renderDisplayValue(value, field, spec);
}

export function renderEditField(field, value, setField, spec) {
  return renderingEngine.renderEditField(field, value, setField, spec);
}
