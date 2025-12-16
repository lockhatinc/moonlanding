import React from 'react';
import { createFieldRenderer } from './field-renderer-factory';

export function FieldRenderer({
  field,
  value,
  mode = 'display',
  onChange,
  error,
  disabled = false,
  required = false,
  spec,
  ...props
}) {
  const Renderer = createFieldRenderer(field.type, mode);

  if (!Renderer) {
    return (
      <div style={{ color: 'red', fontWeight: 'bold' }}>
        FieldRenderer not found for type: {field.type} mode: {mode}
      </div>
    );
  }

  return (
    <Renderer
      field={field}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      required={required}
      spec={spec}
      {...props}
    />
  );
}

export function renderField(field, value, mode = 'display', options = {}) {
  const Renderer = createFieldRenderer(field.type, mode);

  if (!Renderer) {
    return <span>Invalid field type: {field.type}</span>;
  }

  return (
    <Renderer
      field={field}
      value={value}
      {...options}
    />
  );
}
