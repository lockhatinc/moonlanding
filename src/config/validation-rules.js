import { validators } from '@/lib/validator-helpers';

export const VALIDATION_RULES = {
  email: (value) => validators.email(value, 'Invalid email'),

  text: (value, field) =>
    validators.required(value, `${field.label} required`, field.required) ||
    validators.minLength(value, field.minLength, `Min ${field.minLength}`) ||
    validators.maxLength(value, field.maxLength, `Max ${field.maxLength}`),

  int: (value, field) =>
    validators.required(value, `${field.label} required`, field.required) ||
    validators.integer(value, 'Must be integer') ||
    validators.min(value, field.min, `Min ${field.min}`) ||
    validators.max(value, field.max, `Max ${field.max}`),

  decimal: (value, field) =>
    validators.required(value, `${field.label} required`, field.required) ||
    validators.number(value, 'Must be number') ||
    validators.min(value, field.min, `Min ${field.min}`) ||
    validators.max(value, field.max, `Max ${field.max}`),

  date: (value, field) =>
    validators.required(value, `${field.label} required`, field.required) ||
    validators.date(value, 'Invalid date'),

  timestamp: (value, field) =>
    validators.required(value, `${field.label} required`, field.required) ||
    validators.date(value, 'Invalid date/time'),

  bool: (value, field) =>
    field.required && value === undefined ? `${field.label} required` : null,

  enum: (value, field, options) => {
    if (field.required && !value) return `${field.label} required`;
    if (value && field.options && !options?.[field.options]?.find(o => String(o.value) === String(value))) {
      return `Invalid ${field.label}`;
    }
    return null;
  },

  ref: (value, field) =>
    validators.required(value, `${field.label} required`, field.required),

  json: (value, field) =>
    validators.required(value, `${field.label} required`, field.required) ||
    validators.json(value, 'Invalid JSON'),

  textarea: (value, field) =>
    validators.required(value, `${field.label} required`, field.required) ||
    validators.minLength(value, field.minLength, `Min ${field.minLength}`) ||
    validators.maxLength(value, field.maxLength, `Max ${field.maxLength}`),
};

export function createValidator(field) {
  return (value, options) => {
    const validator = VALIDATION_RULES[field.type];
    if (!validator) return null;
    return validator(value, field, options);
  };
}
