import { VALIDATION } from '@/config/constants';
import { executeHook } from './hook-engine';

const validators = {
  email: (v) => !v || VALIDATION.EMAIL_REGEX.test(v) ? null : 'Invalid email',
  text: (v, f) => (f.required && !v) ? `${f.label} required` : (f.minLength && v?.length < f.minLength) ? `Min ${f.minLength}` : (f.maxLength && v?.length > f.maxLength) ? `Max ${f.maxLength}` : null,
  int: (v, f) => (f.required && (v === undefined || v === null || v === '')) ? `${f.label} required` : (v !== undefined && v !== null && v !== '' && (isNaN(v) || !Number.isInteger(Number(v)))) ? 'Must be integer' : (f.min !== undefined && Number(v) < f.min) ? `Min ${f.min}` : (f.max !== undefined && Number(v) > f.max) ? `Max ${f.max}` : null,
  decimal: (v, f) => (f.required && (v === undefined || v === null || v === '')) ? `${f.label} required` : (v !== undefined && v !== null && v !== '' && isNaN(v)) ? 'Must be number' : (f.min !== undefined && Number(v) < f.min) ? `Min ${f.min}` : (f.max !== undefined && Number(v) > f.max) ? `Max ${f.max}` : null,
  date: (v, f) => (f.required && !v) ? `${f.label} required` : (v && isNaN(new Date(v).getTime())) ? 'Invalid date' : null,
  timestamp: (v, f) => (f.required && !v) ? `${f.label} required` : (v && isNaN(new Date(v).getTime())) ? 'Invalid date/time' : null,
  bool: (v, f) => (f.required && v === undefined) ? `${f.label} required` : null,
  enum: (v, f, opts) => (f.required && !v) ? `${f.label} required` : (v && f.options && !opts?.[f.options]?.find(o => String(o.value) === String(v))) ? `Invalid ${f.label}` : null,
  ref: (v, f) => (f.required && !v) ? `${f.label} required` : null,
  json: (v, f) => (f.required && !v) ? `${f.label} required` : (v && typeof v === 'string') ? (() => { try { JSON.parse(v); return null; } catch { return 'Invalid JSON'; } })() : null,
  textarea: (v, f) => (f.required && !v) ? `${f.label} required` : (f.minLength && v?.length < f.minLength) ? `Min ${f.minLength}` : (f.maxLength && v?.length > f.maxLength) ? `Max ${f.maxLength}` : null,
};

export const validateField = async (spec, fieldName, value) => {
  const field = spec.fields[fieldName];
  if (!field) return null;

  const validator = validators[field.type];
  let error = validator ? validator(value, field, spec.options) : null;

  if (!error) {
    const hook = await executeHook(`validate:${spec.name}:${fieldName}`, { value, field, error });
    error = hook?.error || null;
  }

  return error;
};

export const validateEntity = async (spec, data) => {
  const errors = {};
  for (const [fieldName, field] of Object.entries(spec.fields)) {
    if (fieldName === 'id') continue;
    const error = await validateField(spec, fieldName, data[fieldName]);
    if (error) errors[fieldName] = error;
  }
  const hook = await executeHook(`validate:${spec.name}`, { data, errors });
  return hook?.errors || errors;
};

export const validateUpdate = async (spec, id, data) => {
  const errors = await validateEntity(spec, data);
  await executeHook(`validateUpdate:${spec.name}`, { id, data, errors });
  return errors;
};

export const hasErrors = (errors) => Object.keys(errors).length > 0;
