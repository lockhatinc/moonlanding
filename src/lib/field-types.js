import { DISPLAY } from '@/config/constants';
import { secondsToDate, dateToSeconds, formatDate } from './utils-client';

function truncateText(text, limit = DISPLAY.TEXT_PREVIEW) {
  if (!text) return '';
  const str = String(text);
  return str.length > limit ? str.substring(0, limit) + '...' : str;
}

function truncateJson(val) {
  const str = typeof val === 'string' ? val : JSON.stringify(val);
  return str.length > DISPLAY.JSON_PREVIEW ? str.substring(0, DISPLAY.JSON_PREVIEW) + '...' : str;
}

function truncateTextarea(text) {
  return truncateText(text, DISPLAY.TEXTAREA_PREVIEW);
}

export const fieldRegistry = {
  text: {
    sqlType: 'TEXT',
    coerce: (val) => val,
    format: (val) => String(val ?? ''),
    isValid: () => true,
  },

  email: {
    sqlType: 'TEXT',
    coerce: (val) => val,
    format: (val) => String(val ?? ''),
    isValid: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  },

  textarea: {
    sqlType: 'TEXT',
    coerce: (val) => val,
    format: (val) => truncateTextarea(String(val ?? '')),
    isValid: () => true,
  },

  int: {
    sqlType: 'INTEGER',
    coerce: (val) => {
      if (val === undefined || val === '' || val === null) return null;
      return parseInt(val, 10) || 0;
    },
    format: (val) => String(val ?? ''),
    isValid: () => true,
  },

  decimal: {
    sqlType: 'REAL',
    coerce: (val) => {
      if (val === undefined || val === '' || val === null) return null;
      return parseFloat(val) || 0;
    },
    format: (val) => (typeof val === 'number' ? val.toFixed(2) : val),
    isValid: () => true,
  },

  bool: {
    sqlType: 'INTEGER',
    coerce: (val) => (val === true || val === 'true' || val === 'on' || val === 1 ? 1 : 0),
    format: (val) => (val ? 'Yes' : 'No'),
    isValid: () => true,
  },

  date: {
    sqlType: 'INTEGER',
    coerce: (val) => {
      if (!val || typeof val !== 'string') return val;
      return dateToSeconds(new Date(val));
    },
    format: (val) => formatDate(val, 'locale'),
    isValid: (val) => !isNaN(new Date(val).getTime()),
  },

  timestamp: {
    sqlType: 'INTEGER',
    coerce: (val) => {
      if (!val || typeof val !== 'string') return val;
      return dateToSeconds(new Date(val));
    },
    format: (val) => formatDate(val, 'datetime'),
    isValid: (val) => !isNaN(new Date(val).getTime()),
  },

  enum: {
    sqlType: 'TEXT',
    coerce: (val) => val,
    format: (val, field, spec) => {
      if (!field.options || !spec || val === null || val === undefined) return String(val);
      const opt = spec.options?.[field.options]?.find(o => String(o.value) === String(val));
      return opt ? { label: opt.label, color: opt.color || 'gray' } : String(val);
    },
    isValid: () => true,
  },

  ref: {
    sqlType: 'TEXT',
    coerce: (val) => val,
    format: (val, field, spec, row) => {
      if (!field.display) return val;
      if (field.display === 'avatars' && Array.isArray(val)) {
        return { type: 'avatars', users: val };
      }
      return row?.[`${field.key}_display`] || val;
    },
    isValid: () => true,
  },

  json: {
    sqlType: 'TEXT',
    coerce: (val) => {
      if (val === undefined || val === '' || val === null) return null;
      return typeof val === 'string' ? val : JSON.stringify(val);
    },
    format: (val) => truncateJson(val),
    isValid: () => true,
  },

  image: {
    sqlType: 'TEXT',
    coerce: (val) => val,
    format: (val) => val,
    isValid: () => true,
  },

  id: {
    sqlType: 'TEXT PRIMARY KEY',
    coerce: (val) => val,
    format: (val) => val,
    isValid: () => true,
  },
};

export function getFieldHandler(type) {
  return fieldRegistry[type] || fieldRegistry.text;
}

export function coerceFieldValue(value, type) {
  const handler = getFieldHandler(type);
  return handler.coerce(value);
}

export function formatFieldValue(value, field, spec, row) {
  if (value === null || value === undefined || value === '') return null;
  const handler = getFieldHandler(field.type);
  return handler.format(value, field, spec, row);
}

export function validateFieldValue(value, field) {
  const handler = getFieldHandler(field.type);
  return handler.isValid(value, field);
}
