import { validators } from '@/lib/validator-helpers';
import { VALIDATION_MESSAGES } from './validation-config';

export const VALIDATION_RULES = {
  email: (value) => validators.email(value, VALIDATION_MESSAGES.email()),

  text: (value, field) =>
    validators.required(value, VALIDATION_MESSAGES.required(field.label), field.required) ||
    validators.minLength(value, field.minLength, VALIDATION_MESSAGES.minLength(field.minLength)) ||
    validators.maxLength(value, field.maxLength, VALIDATION_MESSAGES.maxLength(field.maxLength)),

  int: (value, field) =>
    validators.required(value, VALIDATION_MESSAGES.required(field.label), field.required) ||
    validators.integer(value, VALIDATION_MESSAGES.integer()) ||
    validators.min(value, field.min, VALIDATION_MESSAGES.min(field.min)) ||
    validators.max(value, field.max, VALIDATION_MESSAGES.max(field.max)),

  decimal: (value, field) =>
    validators.required(value, VALIDATION_MESSAGES.required(field.label), field.required) ||
    validators.number(value, VALIDATION_MESSAGES.number()) ||
    validators.min(value, field.min, VALIDATION_MESSAGES.min(field.min)) ||
    validators.max(value, field.max, VALIDATION_MESSAGES.max(field.max)),

  date: (value, field) =>
    validators.required(value, VALIDATION_MESSAGES.required(field.label), field.required) ||
    validators.date(value, VALIDATION_MESSAGES.date()),

  timestamp: (value, field) =>
    validators.required(value, VALIDATION_MESSAGES.required(field.label), field.required) ||
    validators.date(value, VALIDATION_MESSAGES.datetime()),

  bool: (value, field) =>
    field.required && value === undefined ? VALIDATION_MESSAGES.required(field.label) : null,

  enum: (value, field, options) => {
    if (field.required && !value) return VALIDATION_MESSAGES.required(field.label);
    if (value && field.options && !options?.[field.options]?.find(o => String(o.value) === String(value))) {
      return VALIDATION_MESSAGES.invalid(field.label);
    }
    return null;
  },

  ref: (value, field) =>
    validators.required(value, VALIDATION_MESSAGES.required(field.label), field.required),

  json: (value, field) =>
    validators.required(value, VALIDATION_MESSAGES.required(field.label), field.required) ||
    validators.json(value, VALIDATION_MESSAGES.json()),

  textarea: (value, field) =>
    validators.required(value, VALIDATION_MESSAGES.required(field.label), field.required) ||
    validators.minLength(value, field.minLength, VALIDATION_MESSAGES.minLength(field.minLength)) ||
    validators.maxLength(value, field.maxLength, VALIDATION_MESSAGES.maxLength(field.maxLength)),
};

export function createValidator(field) {
  return (value, options) => {
    const validator = VALIDATION_RULES[field.type];
    if (!validator) return null;
    return validator(value, field, options);
  };
}

const formatLabel = (fieldName) =>
  fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

export const validationRuleGenerators = {
  required: (field, fieldName) => ({
    type: 'required',
    message: VALIDATION_MESSAGES.required(field.label || formatLabel(fieldName)),
  }),

  minLength: (field) => ({
    type: 'minLength',
    value: field.minLength,
    message: VALIDATION_MESSAGES.minLength(field.minLength),
  }),

  maxLength: (field) => ({
    type: 'maxLength',
    value: field.maxLength,
    message: VALIDATION_MESSAGES.maxLength(field.maxLength),
  }),

  min: (field) => ({
    type: 'min',
    value: field.min,
    message: VALIDATION_MESSAGES.min(field.min),
  }),

  max: (field) => ({
    type: 'max',
    value: field.max,
    message: VALIDATION_MESSAGES.max(field.max),
  }),

  range: (field) => ({
    type: 'range',
    min: field.min,
    max: field.max,
    message: VALIDATION_MESSAGES.range(field.min, field.max),
  }),

  email: () => ({
    type: 'email',
    message: VALIDATION_MESSAGES.email(),
  }),

  pattern: (field) => ({
    type: 'pattern',
    value: field.pattern,
    message: field.patternMessage || VALIDATION_MESSAGES.pattern(),
  }),
};
