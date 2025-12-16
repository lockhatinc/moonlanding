// UNIFIED FIELD REGISTRY - Single source for all field type handling
// Consolidates: field-types.js, field-handlers.js, and render logic
// Every field type has consistent format/coerce/validate/display behavior

import { COLORS, BADGE_COLORS_MANTINE, DISPLAY } from '@/config/constants';

const SECONDS_TO_MS = 1000;

export function secondsToDate(seconds) {
  return seconds ? new Date(seconds * SECONDS_TO_MS) : null;
}

export function dateToSeconds(date) {
  return date ? Math.floor(date.getTime() / SECONDS_TO_MS) : null;
}

export function formatDate(value, format = 'locale') {
  if (!value) return null;
  const date = typeof value === 'number' ? secondsToDate(value) : new Date(value);
  if (isNaN(date.getTime())) return null;
  switch (format) {
    case 'iso': return date.toISOString().split('T')[0];
    case 'datetime': return date.toLocaleString();
    case 'time': return date.toLocaleTimeString();
    default: return date.toLocaleDateString();
  }
}

export function parseDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return dateToSeconds(date);
}

// Truncate helpers
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

// ============ FIELD REGISTRY ============
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

// ============ FIELD HANDLER FUNCTIONS ============

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

// ============ HELPER FUNCTIONS ============

export function getEnumOption(spec, optionsKey, value) {
  return spec.options?.[optionsKey]?.find(o => String(o.value) === String(value));
}

export function getEnumOptions(spec, optionsKey) {
  return spec.options?.[optionsKey] || [];
}

// Legacy exports for compatibility
export const BADGE_COLORS = COLORS.BADGE;

// Helper to get badge style for Mantine components
export function getBadgeStyle(colorName) {
  return BADGE_COLORS_MANTINE[colorName] || BADGE_COLORS_MANTINE.gray;
}
