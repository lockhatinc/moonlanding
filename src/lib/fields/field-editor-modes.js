import React from 'react';
import {
  TextInput,
  Textarea,
  NumberInput,
  Checkbox,
  Select,
  MultiSelect,
  DateInput,
  TimeInput,
  Group,
  FileInput,
} from '@mantine/core';

export const EDIT_RENDERERS = {
  text: ({ field, value, onChange, error, disabled, required }) => (
    <TextInput
      label={field.label}
      placeholder={field.placeholder}
      value={value || ''}
      onChange={(e) => onChange?.(e.currentTarget.value)}
      error={error}
      disabled={disabled}
      required={required}
      minLength={field.minLength}
      maxLength={field.maxLength}
    />
  ),

  email: ({ field, value, onChange, error, disabled, required }) => (
    <TextInput
      label={field.label}
      placeholder={field.placeholder}
      type="email"
      value={value || ''}
      onChange={(e) => onChange?.(e.currentTarget.value)}
      error={error}
      disabled={disabled}
      required={required}
    />
  ),

  textarea: ({ field, value, onChange, error, disabled, required }) => (
    <Textarea
      label={field.label}
      placeholder={field.placeholder}
      value={value || ''}
      onChange={(e) => onChange?.(e.currentTarget.value)}
      error={error}
      disabled={disabled}
      required={required}
      minRows={field.minRows || 3}
      maxRows={field.maxRows || 10}
      minLength={field.minLength}
      maxLength={field.maxLength}
    />
  ),

  int: ({ field, value, onChange, error, disabled, required }) => (
    <NumberInput
      label={field.label}
      placeholder={field.placeholder}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      required={required}
      min={field.min}
      max={field.max}
      step={1}
    />
  ),

  decimal: ({ field, value, onChange, error, disabled, required }) => (
    <NumberInput
      label={field.label}
      placeholder={field.placeholder}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      required={required}
      min={field.min}
      max={field.max}
      step={field.step || 0.01}
      precision={field.precision || 2}
    />
  ),

  date: ({ field, value, onChange, error, disabled, required }) => (
    <DateInput
      label={field.label}
      placeholder={field.placeholder}
      value={value ? new Date(value) : null}
      onChange={(date) => onChange?.(date?.toISOString())}
      error={error}
      disabled={disabled}
      required={required}
    />
  ),

  timestamp: ({ field, value, onChange, error, disabled, required }) => (
    <Group grow>
      <DateInput
        label={field.label}
        placeholder="Date"
        value={value ? new Date(value) : null}
        onChange={(date) => {
          if (date) {
            const time = value ? new Date(value) : new Date();
            const newDate = new Date(date);
            newDate.setHours(time.getHours());
            newDate.setMinutes(time.getMinutes());
            onChange?.(newDate.toISOString());
          }
        }}
        error={error}
        disabled={disabled}
        required={required}
      />
      <TimeInput
        label="Time"
        value={value ? new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
        onChange={(e) => {
          if (value && e.currentTarget.value) {
            const [hours, minutes] = e.currentTarget.value.split(':');
            const date = new Date(value);
            date.setHours(parseInt(hours), parseInt(minutes));
            onChange?.(date.toISOString());
          }
        }}
        error={error}
        disabled={disabled}
      />
    </Group>
  ),

  bool: ({ field, value, onChange, error, disabled }) => (
    <Checkbox
      label={field.label}
      checked={!!value}
      onChange={(e) => onChange?.(e.currentTarget.checked)}
      error={error}
      disabled={disabled}
    />
  ),

  enum: ({ field, value, onChange, error, disabled, required, spec }) => {
    const options = spec?.options?.[field.options] || [];
    const selectOptions = options.map(opt => ({
      label: opt.label,
      value: String(opt.value),
    }));

    if (field.multi) {
      return (
        <MultiSelect
          label={field.label}
          placeholder={field.placeholder}
          data={selectOptions}
          value={(value || []).map(String)}
          onChange={onChange}
          error={error}
          disabled={disabled}
          required={required}
          searchable
          clearable
        />
      );
    }

    return (
      <Select
        label={field.label}
        placeholder={field.placeholder}
        data={selectOptions}
        value={value ? String(value) : ''}
        onChange={onChange}
        error={error}
        disabled={disabled}
        required={required}
        searchable
        clearable
      />
    );
  },

  ref: ({ field, value, onChange, error, disabled, required, spec }) => {
    const options = spec?.options?.[field.key] || [];
    const selectOptions = options.map(opt => ({
      label: opt.label || opt.value,
      value: opt.value,
    }));

    if (field.multi) {
      return (
        <MultiSelect
          label={field.label}
          placeholder={field.placeholder}
          data={selectOptions}
          value={(value || []).map(String)}
          onChange={onChange}
          error={error}
          disabled={disabled}
          required={required}
          searchable
        />
      );
    }

    return (
      <Select
        label={field.label}
        placeholder={field.placeholder}
        data={selectOptions}
        value={value ? String(value) : ''}
        onChange={onChange}
        error={error}
        disabled={disabled}
        required={required}
        searchable
      />
    );
  },

  image: ({ field, value, onChange, error, disabled }) => (
    <FileInput
      label={field.label}
      placeholder={field.placeholder}
      accept="image/*"
      onChange={(file) => {
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => onChange?.(e.target.result);
          reader.readAsDataURL(file);
        }
      }}
      error={error}
      disabled={disabled}
    />
  ),

  json: ({ field, value, onChange, error, disabled, required }) => (
    <Textarea
      label={field.label}
      placeholder={field.placeholder}
      value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
      onChange={(e) => onChange?.(e.currentTarget.value)}
      error={error}
      disabled={disabled}
      required={required}
      minRows={4}
      fontFamily="monospace"
    />
  ),
};

export function initializeEditRenderers(rendererRegistry) {
  for (const [type, component] of Object.entries(EDIT_RENDERERS)) {
    rendererRegistry.registerRenderer(type, 'edit', component);
    rendererRegistry.registerRenderer(type, 'form', component);
  }
}
