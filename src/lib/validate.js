import { getSpec } from '@/config/spec-helpers';
import { get } from '@/lib/query-engine';
import { isValidTransition } from '@/lib/status-helpers';
import { isWithinYears, isBeforeDate } from '@/lib/date-utils';

const HTML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function sanitizeHtml(str) {
  return typeof str === 'string' ? str.replace(/[&<>"']/g, c => HTML_ESC[c]) : str;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DISPOSABLE_DOMAINS = new Set(['mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email', 'yopmail.com']);

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return { valid: false, reason: 'Email is required' };
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) return { valid: false, reason: 'Invalid email format' };
  const domain = trimmed.split('@')[1];
  if (!domain || domain.length < 3 || !domain.includes('.')) return { valid: false, reason: 'Invalid email domain' };
  if (DISPOSABLE_DOMAINS.has(domain)) return { valid: false, reason: 'Disposable email addresses are not allowed' };
  return { valid: true, email: trimmed, domain };
}

function validateType(fieldDef, value, fieldName) {
  const { type, min, max } = fieldDef;
  if (type === 'string' || type === 'text') {
    if (typeof value !== 'string') return `Field '${fieldName}' must be a string`;
  } else if (type === 'number') {
    if (typeof value !== 'number' || isNaN(value)) return `Field '${fieldName}' must be a number`;
    if (min !== undefined && value < min) return `Field '${fieldName}' must be at least ${min}`;
    if (max !== undefined && value > max) return `Field '${fieldName}' must be at most ${max}`;
  } else if (type === 'boolean') {
    if (typeof value !== 'boolean') return `Field '${fieldName}' must be a boolean`;
  } else if (type === 'timestamp') {
    if (isNaN(Number(value))) return `Field '${fieldName}' must be a valid timestamp`;
  } else if (type === 'json') {
    if (typeof value === 'string') { try { JSON.parse(value); } catch { return `Field '${fieldName}' must be valid JSON`; } }
    else if (typeof value !== 'object') return `Field '${fieldName}' must be an object or JSON string`;
  }
  return null;
}

function resolveEnumOptions(fieldDef, entityName) {
  if (Array.isArray(fieldDef.options)) return fieldDef.options.map(o => typeof o === 'object' ? o.value : o);
  if (typeof fieldDef.options === 'string') {
    try {
      const spec = getSpec(entityName);
      const list = spec.options?.[fieldDef.options];
      if (list) return list.map(o => typeof o === 'object' ? o.value : o);
    } catch { /* skip */ }
  }
  return [];
}

export const validateField = async (fieldDef, value, options = {}) => {
  const { fieldName, entityName, existingValue } = options;
  if (fieldDef.auto || fieldDef.auto_generate || fieldDef.readOnly) return null;
  if (fieldDef.required && (value === null || value === undefined || value === '')) return `Field '${fieldName}' is required`;
  if (value === null || value === undefined || value === '') return null;

  const typeErr = validateType(fieldDef, value, fieldName);
  if (typeErr) return typeErr;

  if (fieldDef.type === 'enum' && fieldDef.options) {
    const allowed = resolveEnumOptions(fieldDef, entityName);
    if (allowed.length > 0 && !allowed.includes(value)) return `Invalid value for '${fieldName}'. Expected one of: ${allowed.join(', ')}`;
  }

  if (fieldDef.type === 'ref' && fieldDef.ref) {
    if (existingValue !== undefined && value === existingValue) return null;
    try {
      const table = fieldDef.ref === 'user' ? 'users' : fieldDef.ref;
      if (!get(table, value)) return `${fieldDef.ref.charAt(0).toUpperCase() + fieldDef.ref.slice(1)} with id '${value}' not found`;
    } catch { return null; }
  }

  return null;
};

async function validateFields(spec, data, entityName, existingRecord) {
  const errors = {};
  for (const [fieldName, fieldDef] of Object.entries(spec.fields)) {
    if (fieldDef.type === 'id') continue;
    if (existingRecord !== undefined && !(fieldName in data)) continue;
    const value = data[fieldName];
    const existingValue = existingRecord?.[fieldName];
    const error = await validateField(fieldDef, value, { fieldName, entityName, existingValue });
    if (error) errors[fieldName] = error;
    if (fieldDef.unique && value != null && value !== '' && value !== existingValue) {
      try {
        const table = entityName === 'user' ? 'users' : entityName;
        const dup = get(table, undefined, { [fieldName]: value });
        if (dup && (!existingRecord || dup.id !== existingRecord.id)) errors[fieldName] = `Field '${fieldName}' must be unique`;
      } catch { /* skip */ }
    }
  }
  return errors;
}

export const validateEntity = async (entityName, data) => validateFields(getSpec(entityName), data, entityName);

export const validateUpdate = async (entityName, id, data) => {
  const spec = getSpec(entityName);
  let existing = null;
  try { existing = get(entityName, id); } catch { /* proceed */ }
  return validateFields(spec, data, entityName, existing || {});
};

export const hasErrors = (errors) => Object.keys(errors || {}).length > 0;

export function validateStatusTransition(entityType, currentStatus, newStatus) {
  if (!currentStatus || !newStatus) return { valid: false, reason: 'Status values required' };
  if (currentStatus === newStatus) return { valid: true };
  if (!isValidTransition(entityType, currentStatus, newStatus)) {
    return { valid: false, reason: `Cannot transition ${entityType} from '${currentStatus}' to '${newStatus}'` };
  }
  return { valid: true };
}

export function validateDateRange(startSeconds, endSeconds, label = 'date') {
  if (!startSeconds || !endSeconds) return { valid: true };
  if (isBeforeDate(endSeconds, startSeconds)) return { valid: false, reason: `End ${label} cannot be before start ${label}` };
  return { valid: true };
}

export function validateDeadline(deadlineSeconds, referenceSeconds, maxYears = 2) {
  if (!deadlineSeconds) return { valid: false, reason: 'Deadline is required' };
  if (referenceSeconds && isBeforeDate(deadlineSeconds, referenceSeconds)) {
    return { valid: false, reason: 'Deadline cannot be before the reference date' };
  }
  if (!isWithinYears(deadlineSeconds, maxYears)) {
    return { valid: false, reason: `Deadline must be within ${maxYears} years` };
  }
  return { valid: true };
}

export const sanitizeData = (data, spec) => {
  const sanitized = { ...data };
  for (const [fieldName, value] of Object.entries(sanitized)) {
    const fieldDef = spec.fields?.[fieldName];
    if (fieldDef && (fieldDef.type === 'string' || fieldDef.type === 'text') && typeof value === 'string') {
      sanitized[fieldName] = sanitizeHtml(value);
    }
  }
  return sanitized;
};
