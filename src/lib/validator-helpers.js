import { VALIDATION } from '@/config/data-constants';

export const isEmpty = (v) => v === undefined || v === null || v === '';

export const validators = {
  required: (value, message, condition = true) =>
    condition && isEmpty(value) ? message : null,

  minLength: (value, minLength, message) =>
    value && value.length < minLength ? message : null,

  maxLength: (value, maxLength, message) =>
    value && value.length > maxLength ? message : null,

  min: (value, min, message) =>
    !isEmpty(value) && Number(value) < min ? message : null,

  max: (value, max, message) =>
    !isEmpty(value) && Number(value) > max ? message : null,

  range: (value, min, max, message) => {
    if (isEmpty(value)) return null;
    const num = Number(value);
    return num < min || num > max ? message : null;
  },

  pattern: (value, pattern, message) => {
    if (isEmpty(value)) return null;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return !regex.test(value) ? message : null;
  },

  email: (value, message) => {
    if (isEmpty(value)) return null;
    return VALIDATION.EMAIL_REGEX.test(value) ? null : message;
  },

  integer: (value, message) =>
    !isEmpty(value) && (isNaN(value) || !Number.isInteger(Number(value))) ? message : null,

  number: (value, message) =>
    !isEmpty(value) && isNaN(value) ? message : null,

  date: (value, message) =>
    value && isNaN(new Date(value).getTime()) ? message : null,

  json: (value, message) => {
    if (!value || typeof value !== 'string') return null;
    try {
      JSON.parse(value);
      return null;
    } catch {
      return message;
    }
  },
};
