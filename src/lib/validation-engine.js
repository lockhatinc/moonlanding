import { VALIDATION } from '@/config/constants';
import { executeHook } from './hook-registry';

const validators = {
  email: (value) => {
    if (!value) return null;
    if (!VALIDATION.EMAIL_REGEX.test(value)) return 'Invalid email format';
    return null;
  },
  text: (value, field) => {
    if (field.required && !value) return `${field.label} is required`;
    if (field.minLength && value?.length < field.minLength) return `Minimum ${field.minLength} characters`;
    if (field.maxLength && value?.length > field.maxLength) return `Maximum ${field.maxLength} characters`;
    return null;
  },
  int: (value, field) => {
    if (field.required && value === undefined) return `${field.label} is required`;
    if (value !== undefined && (isNaN(value) || !Number.isInteger(Number(value)))) return 'Must be a whole number';
    if (field.min !== undefined && Number(value) < field.min) return `Minimum ${field.min}`;
    if (field.max !== undefined && Number(value) > field.max) return `Maximum ${field.max}`;
    return null;
  },
  decimal: (value, field) => {
    if (field.required && value === undefined) return `${field.label} is required`;
    if (value !== undefined && isNaN(value)) return 'Must be a valid number';
    if (field.min !== undefined && Number(value) < field.min) return `Minimum ${field.min}`;
    if (field.max !== undefined && Number(value) > field.max) return `Maximum ${field.max}`;
    return null;
  },
  date: (value, field) => {
    if (field.required && !value) return `${field.label} is required`;
    if (value && isNaN(new Date(value).getTime())) return 'Invalid date';
    return null;
  },
  bool: (value, field) => {
    if (field.required && value === undefined) return `${field.label} is required`;
    return null;
  },
  enum: (value, field, spec) => {
    if (field.required && !value) return `${field.label} is required`;
    if (value && field.options) {
      const options = spec.options[field.options] || [];
      if (!options.find(o => o.value === value)) return `Invalid ${field.label}`;
    }
    return null;
  },
  ref: (value, field) => {
    if (field.required && !value) return `${field.label} is required`;
    return null;
  },
  json: (value, field) => {
    if (field.required && !value) return `${field.label} is required`;
    if (value && typeof value === 'string') {
      try {
        JSON.parse(value);
      } catch {
        return 'Invalid JSON format';
      }
    }
    return null;
  },
  textarea: (value, field) => {
    if (field.required && !value) return `${field.label} is required`;
    if (field.minLength && value?.length < field.minLength) return `Minimum ${field.minLength} characters`;
    if (field.maxLength && value?.length > field.maxLength) return `Maximum ${field.maxLength} characters`;
    return null;
  },
};

export function registerValidator(type, validator) {
  validators[type] = validator;
}

export async function validateField(spec, fieldName, value) {
  const field = spec.fields[fieldName];
  if (!field) return null;

  const validator = validators[field.type];
  let error = validator ? validator(value, field, spec) : null;

  if (!error) {
    error = await executeHook(`validate:${spec.name}:${fieldName}`, { value, field, error }).then(r => r.error);
  }

  return error;
}

export async function validateEntity(spec, data) {
  const errors = {};
  for (const [fieldName, field] of Object.entries(spec.fields)) {
    if (fieldName === 'id') continue;
    const error = await validateField(spec, fieldName, data[fieldName]);
    if (error) errors[fieldName] = error;
  }

  const hookResult = await executeHook(`validate:${spec.name}`, { data, errors });
  return hookResult.errors;
}

export async function validateUpdate(spec, id, data) {
  const errors = await validateEntity(spec, data);
  await executeHook(`validateUpdate:${spec.name}`, { id, data, errors });
  return errors;
}
