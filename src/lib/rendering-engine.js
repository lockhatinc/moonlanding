import React from 'react';
import { Tooltip, Text, Badge } from '@mantine/core';
import { showNotification } from './notification-helpers';
import { EDITABLE_FIELD_RENDERERS, LIST_RENDERERS, DISPLAY_RENDERERS, getFieldRenderers } from '@/config/field-render-config';

const FIELD_RENDERERS = {
  text: getFieldRenderers('text'),
  email: getFieldRenderers('email'),
  textarea: getFieldRenderers('textarea'),
  date: getFieldRenderers('date'),
  timestamp: getFieldRenderers('timestamp'),
  int: getFieldRenderers('int'),
  decimal: getFieldRenderers('decimal'),
  bool: getFieldRenderers('bool'),
  enum: getFieldRenderers('enum'),
  ref: getFieldRenderers('ref'),
  json: getFieldRenderers('json'),
  image: getFieldRenderers('image'),
};

function renderField(fieldType, mode, ...args) {
  const renderer = FIELD_RENDERERS[fieldType]?.[mode] || FIELD_RENDERERS.text[mode];
  return renderer(...args);
}

function createSafeRenderer(mode, config = {}) {
  const { title = `${capitalize(mode)} Error`, textSize = 'sm', autoClose = 3000 } = config;
  return (...args) => {
    try {
      if (mode === 'form') {
        const [field, values, setField, enumData, refData, onBlur] = args;
        const v = values[field.key] ?? '';
        if (field.type === 'enum') return renderField(field.type, 'form', field, v, setField, enumData, undefined, onBlur);
        if (field.type === 'ref') return renderField(field.type, 'form', field, v, setField, enumData, refData, onBlur);
        return renderField(field.type, 'form', field, v, setField, undefined, undefined, onBlur);
      }
      if (mode === 'list') {
        const [value, column, spec, row] = args;
        return renderField(column.type, 'list', value, column, spec, row);
      }
      if (mode === 'display') {
        const [value, field, spec] = args;
        return renderField(field.type, 'display', value, field, spec);
      }
      if (mode === 'edit') {
        const [field, value, setField, spec] = args;
        return renderField(field.type, 'edit', field, value, setField, spec);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const field = mode === 'list' ? args[1] : args[0];
      const fieldKey = field?.key || 'unknown';
      const fieldLabel = field?.label || fieldKey;
      console.error(`[Renderer] ${capitalize(mode)} error for ${fieldKey}:`, { field: fieldKey, type: field?.type, error: msg });
      showNotification.warning(`Failed to render ${fieldLabel}: ${msg}`, title, autoClose);
      return <Tooltip label={`Error: ${msg}`}><Text size={textSize} c="gray">—</Text></Tooltip>;
    }
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const renderFormField = createSafeRenderer('form', { title: 'Form Field Error', autoClose: 4000 });
export const renderCellValue = createSafeRenderer('list', { title: 'Render Error' });

export class RenderingEngine {
  register(mode, fieldType, renderer) {
    if (!FIELD_RENDERERS[fieldType]) FIELD_RENDERERS[fieldType] = {};
    FIELD_RENDERERS[fieldType][mode] = renderer;
  }
  getRenderer(mode, fieldType) {
    return FIELD_RENDERERS[fieldType]?.[mode];
  }
}

export const renderingEngine = new RenderingEngine();
