
import { formatDate, BADGE_COLORS, getEnumOption, dateToSeconds } from './field-types';
import { truncateJson, truncateTextarea } from './display-config';

export const fieldHandlers = {
  text: {
    format: (val) => String(val),
    isValid: () => true,
  },

  email: {
    format: (val) => String(val),
    isValid: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  },

  textarea: {
    format: (val) => truncateTextarea(String(val)),
    isValid: () => true,
  },

  int: {
    format: (val) => String(val),
    coerce: (val) => parseInt(val, 10) || 0,
    isValid: () => true,
  },

  decimal: {
    format: (val) => typeof val === 'number' ? val.toFixed(2) : val,
    coerce: (val) => parseFloat(val) || 0,
    isValid: () => true,
  },

  bool: {
    format: (val) => val ? 'Yes' : 'No',
    coerce: (val) => val === true || val === 'true' || val === 'on' || val === 1 ? 1 : 0,
    isValid: () => true,
  },

  date: {
    format: (val) => formatDate(val, 'locale'),
    coerce: (val) => {
      if (!val || typeof val !== 'string') return val;
      return dateToSeconds(new Date(val));
    },
    isValid: (val) => !isNaN(new Date(val).getTime()),
  },

  timestamp: {
    format: (val) => formatDate(val, 'datetime'),
    coerce: (val) => {
      if (!val || typeof val !== 'string') return val;
      return dateToSeconds(new Date(val));
    },
    isValid: (val) => !isNaN(new Date(val).getTime()),
  },

  enum: {
    format: (val, field, spec) => {
      if (!field.options || !spec) return String(val);
      const opt = getEnumOption(spec, field.options, val);
      return opt ? { label: opt.label, color: BADGE_COLORS[opt.color] || 'gray' } : String(val);
    },
    isValid: () => true,
  },

  ref: {
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
    format: (val) => truncateJson(val),
    coerce: (val) => typeof val === 'string' ? val : JSON.stringify(val),
    isValid: () => true,
  },

  image: {
    format: (val) => val,
    isValid: () => true,
  },

  id: {
    format: (val) => val,
    isValid: () => true,
  },
};

export function getFieldHandler(type) {
  return fieldHandlers[type] || {
    format: (val) => String(val),
    isValid: () => true,
  };
}

export function formatFieldValue(value, field, spec, row) {
  if (value === null || value === undefined || value === '') return null;
  const handler = getFieldHandler(field.type);
  return handler.format(value, field, spec, row);
}

export function coerceFieldValue(value, type) {
  const handler = getFieldHandler(type);
  return handler.coerce ? handler.coerce(value) : value;
}

export function validateFieldValue(value, field) {
  const handler = getFieldHandler(field.type);
  return handler.isValid(value, field);
}

export function getAvailableFieldTypes() {
  return Object.keys(fieldHandlers);
}
