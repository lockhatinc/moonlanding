export const MESSAGES = {
  validation: {
    required: (fieldLabel) => `${fieldLabel} is required`,
    minLength: (fieldLabel, min) => `${fieldLabel} must be at least ${min} characters`,
    maxLength: (fieldLabel, max) => `${fieldLabel} must be no more than ${max} characters`,
    min: (fieldLabel, min) => `${fieldLabel} must be at least ${min}`,
    max: (fieldLabel, max) => `${fieldLabel} must be no more than ${max}`,
    pattern: (fieldLabel) => `${fieldLabel} format is invalid`,
    email: (fieldLabel) => `${fieldLabel} must be a valid email address`,
    date: (fieldLabel) => `${fieldLabel} must be a valid date`,
    type: (fieldLabel, type) => `${fieldLabel} must be of type ${type}`,
    custom: (message) => message,
  },
  permission: {
    denied: 'You do not have permission to perform this action',
    fieldDenied: (fieldLabel) => `You cannot access ${fieldLabel}`,
    createDenied: (entityLabel) => `You cannot create ${entityLabel}`,
    editDenied: (entityLabel) => `You cannot edit ${entityLabel}`,
    deleteDenied: (entityLabel) => `You cannot delete ${entityLabel}`,
    viewDenied: (entityLabel) => `You cannot view ${entityLabel}`,
  },
  operation: {
    created: (entityLabel) => `${entityLabel} created successfully`,
    updated: (entityLabel) => `${entityLabel} updated successfully`,
    deleted: (entityLabel) => `${entityLabel} deleted successfully`,
    notFound: (entityLabel) => `${entityLabel} not found`,
    alreadyExists: (fieldLabel) => `${fieldLabel} already exists`,
    duplicateFound: (entityLabel, field) => `${entityLabel} with this ${field} already exists`,
    invalidTransition: (current, target) => `Cannot transition from ${current} to ${target}`,
    fetchError: (entityLabel) => `Failed to load ${entityLabel}`,
    saveError: (entityLabel) => `Failed to save ${entityLabel}`,
  },
  auth: {
    sessionExpired: 'Your session has expired. Please log in again',
    invalidCredentials: 'Invalid email or password',
    userNotFound: 'User not found',
    accountDisabled: 'Your account has been disabled',
    unauthorized: 'You are not authorized to access this resource',
  },
  system: {
    error: 'An unexpected error occurred',
    retryable: 'An error occurred. Please try again',
    networkError: 'Network error. Please check your connection',
    timeoutError: 'Request timeout. Please try again',
    serverError: 'Server error. Please try again later',
  },
};

export function getMessage(path, ...args) {
  const keys = path.split('.');
  let value = MESSAGES;
  for (const key of keys) {
    value = value?.[key];
    if (!value) throw new Error(`Message not found: ${path}`);
  }
  return typeof value === 'function' ? value(...args) : value;
}

export const ERROR_MESSAGES = MESSAGES;
export const SUCCESS_MESSAGES = MESSAGES.operation;
export const LOG_PREFIXES = {
  ERROR: '[ERROR]',
  WARN: '[WARN]',
  INFO: '[INFO]',
  DEBUG: '[DEBUG]',
};
