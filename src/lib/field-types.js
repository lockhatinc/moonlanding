// Unified Field Type System
// Consolidates field type handling: coercion, formatting, rendering config

// === SQL TYPE MAPPING ===
export const SQL_TYPES = {
  id: 'TEXT PRIMARY KEY', text: 'TEXT', textarea: 'TEXT', email: 'TEXT',
  int: 'INTEGER', decimal: 'REAL', bool: 'INTEGER', date: 'INTEGER',
  timestamp: 'INTEGER', json: 'TEXT', image: 'TEXT', ref: 'TEXT', enum: 'TEXT',
};

// === VALUE COERCION ===
export function coerce(val, type) {
  if (val === undefined || val === '') return type === 'bool' ? 0 : (val === '' ? null : undefined);
  if (type === 'json') return typeof val === 'string' ? val : JSON.stringify(val);
  if (type === 'bool') return val === true || val === 'true' || val === 'on' || val === 1 ? 1 : 0;
  if (type === 'int') return parseInt(val, 10) || 0;
  if (type === 'decimal') return parseFloat(val) || 0;
  if ((type === 'date' || type === 'timestamp') && typeof val === 'string' && val.includes('-')) {
    return Math.floor(new Date(val).getTime() / 1000);
  }
  return val;
}

// === DATE FORMATTING ===
export function formatDate(value, format = 'locale') {
  if (!value) return null;
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
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
  return isNaN(date.getTime()) ? null : Math.floor(date.getTime() / 1000);
}

// === ENUM COLOR MAPPING ===
export const BADGE_COLORS = {
  green: 'green', yellow: 'yellow', amber: 'orange', blue: 'blue', gray: 'gray', red: 'red',
};

export function getEnumOption(spec, optionsKey, value) {
  return spec.options?.[optionsKey]?.find(o => String(o.value) === String(value));
}

export function getEnumOptions(spec, optionsKey) {
  return spec.options?.[optionsKey] || [];
}

// === DISPLAY VALUE FORMATTING ===
export function formatDisplayValue(value, field, spec, row) {
  if (value === null || value === undefined || value === '') return null;

  switch (field.type) {
    case 'enum':
      const opt = getEnumOption(spec, field.options, value);
      return opt ? { label: opt.label, color: BADGE_COLORS[opt.color] || 'gray' } : String(value);
    case 'ref':
      if (field.display === 'avatars' && Array.isArray(value)) return { type: 'avatars', users: value };
      return row?.[`${field.key}_display`] || value;
    case 'date':
    case 'timestamp':
      return formatDate(value);
    case 'bool':
      return value ? 'Yes' : 'No';
    case 'json':
      const str = typeof value === 'string' ? value : JSON.stringify(value);
      return str.length > 50 ? str.substring(0, 50) + '...' : str;
    case 'decimal':
      return typeof value === 'number' ? value.toFixed(2) : value;
    case 'textarea':
      const text = String(value);
      return text.length > 100 ? text.substring(0, 100) + '...' : text;
    default:
      return String(value);
  }
}

// === FORM INPUT VALUE FORMATTING ===
export function formatFormValue(value, fieldType) {
  if (value === null || value === undefined) return '';
  switch (fieldType) {
    case 'date':
      return value ? formatDate(value, 'iso') : '';
    case 'bool':
      return !!value;
    default:
      return value;
  }
}

// === FIELD FILTERING HELPERS ===
export function getListFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => f.list)
    .map(([key, f]) => ({ key, ...f }));
}

export function getFormFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => !f.hidden && !f.readOnly && f.type !== 'id')
    .map(([key, f]) => ({ key, ...f }));
}

export function getDisplayFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => !f.hidden && f.type !== 'id')
    .map(([key, f]) => ({ key, ...f }));
}

export function getSearchFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => f.search)
    .map(([key]) => key);
}

// === ICON HELPER ===
import * as Icons from 'lucide-react';
import { File } from 'lucide-react';

export function getEntityIcon(spec) {
  return Icons[spec.icon] || File;
}

// === AUTO-GENERATE FORM SECTIONS ===
// Groups fields by their explicit `group` property, or infers from field patterns
const FIELD_GROUP_PATTERNS = {
  'Basic Info': [/^name$/, /^email$/, /^status$/, /^type$/, /^key$/, /^year$/, /^month$/],
  'Dates': [/date$/, /^deadline$/, /^expires/],
  'Details': [/^description$/, /^content$/, /^comment$/, /^question$/, /^address$/, /^body$/],
  'Settings': [/^is_/, /^can_/, /^has_/, /^enable/, /^recreate/, /^repeat/],
  'Financial': [/^fee$/, /^wip/, /^amount$/, /^price$/, /value$/],
};

function inferFieldGroup(fieldKey, field) {
  // Explicit group takes priority
  if (field.group) return field.group;
  // Pattern matching fallback
  for (const [group, patterns] of Object.entries(FIELD_GROUP_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(fieldKey)) return group;
    }
  }
  return 'Details';
}

/**
 * Auto-generate form sections from field metadata
 * Falls back to spec.form.sections if defined
 */
export function getFormSections(spec) {
  // Use explicit sections if defined
  if (spec.form?.sections) return spec.form.sections;

  // Auto-generate from fields
  const formFields = getFormFields(spec);
  const groups = {};

  for (const field of formFields) {
    const group = inferFieldGroup(field.key, field);
    if (!groups[group]) groups[group] = [];
    groups[group].push(field.key);
  }

  // Order groups sensibly
  const order = ['Basic Info', 'Team', 'Dates', 'Details', 'Settings', 'Financial'];
  return order
    .filter(g => groups[g]?.length)
    .map(g => ({ label: g, fields: groups[g] }))
    .concat(
      Object.entries(groups)
        .filter(([g]) => !order.includes(g))
        .map(([g, fields]) => ({ label: g, fields }))
    );
}
