export const VALIDATION_MESSAGES = {
  required: (label) => `${label} is required`,
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must not exceed ${max} characters`,
  range: (min, max) => `Must be between ${min} and ${max}`,
  min: (value) => `Must be at least ${value}`,
  max: (value) => `Must be at most ${value}`,
  pattern: () => 'Invalid format',
  email: () => 'Invalid email address',
  integer: () => 'Must be integer',
  number: () => 'Must be number',
  date: () => 'Invalid date',
  datetime: () => 'Invalid date/time',
  json: () => 'Invalid JSON',
  invalid: (label) => `Invalid ${label}`,
};

export const VALIDATION_DEFAULTS = {
  TEXT_MIN_LENGTH: 1,
  TEXT_MAX_LENGTH: 255,
  TEXTAREA_MAX_LENGTH: 5000,
  NUMBER_MIN: 0,
  NUMBER_MAX: 999999,
  YEAR_MIN: 2020,
  YEAR_MAX: 2099,
};
