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

function createSimpleType(sqlType, overrides = {}) {
  return {
    sqlType,
    coerce: (val) => val,
    format: (val) => val,
    isValid: () => true,
    ...overrides,
  };
}

function createNumberType(sqlType, coerceFn, formatFn) {
  return {
    sqlType,
    coerce: coerceFn,
    format: formatFn,
    isValid: () => true,
  };
}

function createDateType(sqlType, formatType) {
  return {
    sqlType,
    coerce: (val) => (!val || typeof val !== 'string' ? val : dateToSeconds(new Date(val))),
    format: (val) => formatDate(val, formatType),
    isValid: (val) => !isNaN(new Date(val).getTime()),
  };
}

export const fieldRegistry = {
  text: createSimpleType('TEXT', {
    format: (val) => String(val ?? ''),
  }),

  email: createSimpleType('TEXT', {
    format: (val) => String(val ?? ''),
    isValid: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  }),

  textarea: createSimpleType('TEXT', {
    format: (val) => truncateTextarea(String(val ?? '')),
  }),

  int: createNumberType(
    'INTEGER',
    (val) => (val === undefined || val === '' || val === null ? null : parseInt(val, 10) || 0),
    (val) => String(val ?? '')
  ),

  decimal: createNumberType(
    'REAL',
    (val) => (val === undefined || val === '' || val === null ? null : parseFloat(val) || 0),
    (val) => (typeof val === 'number' ? val.toFixed(2) : val)
  ),

  bool: createSimpleType('INTEGER', {
    coerce: (val) => (val === true || val === 'true' || val === 'on' || val === 1 ? 1 : 0),
    format: (val) => (val ? 'Yes' : 'No'),
  }),

  date: createDateType('INTEGER', 'locale'),

  timestamp: createDateType('INTEGER', 'datetime'),

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

  json: createSimpleType('TEXT', {
    coerce: (val) => {
      if (val === undefined || val === '' || val === null) return null;
      return typeof val === 'string' ? val : JSON.stringify(val);
    },
    format: (val) => truncateJson(val),
  }),

  image: createSimpleType('TEXT'),

  id: createSimpleType('TEXT PRIMARY KEY'),
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
